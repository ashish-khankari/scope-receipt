import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config({ path: '.env.local' });
dotenv.config();

const DB_HOST = process.env.DB_HOST;
const DB_PORT = Number(process.env.DB_PORT);
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

async function initDB() {
  console.log(`[init-db] Connecting to MySQL at ${DB_HOST}:${DB_PORT} as ${DB_USER}...`);

  // 1. Connect without specifying database to create database if not exists
  const serverConn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
  });

  console.log(`[init-db] Connected. Ensuring database '${DB_NAME}' exists...`);
  await serverConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await serverConn.end();

  // 2. Connect to the database
  const dbConn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  console.log(`[init-db] Connected to database '${DB_NAME}'. Ensuring tables...`);

  // 3. Create users table
  await dbConn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      google_id VARCHAR(255),
      credits INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL,
      updated_at DATETIME
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 4. Create credit_transactions table
  await dbConn.query(`
    CREATE TABLE IF NOT EXISTS credit_transactions (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      type ENUM('purchase', 'receipt_created', 'refund', 'adjustment') NOT NULL,
      credits INT NOT NULL,
      stripe_checkout_session_id VARCHAR(255),
      stripe_payment_intent_id VARCHAR(255),
      receipt_id VARCHAR(64),
      created_at DATETIME NOT NULL,
      INDEX idx_user_id (user_id),
      CONSTRAINT fk_credit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 5. Create stripe_events table for webhook idempotency
  await dbConn.query(`
    CREATE TABLE IF NOT EXISTS stripe_events (
      id VARCHAR(255) PRIMARY KEY,
      event_type VARCHAR(100) NOT NULL,
      processed_at DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 6. Create or migrate receipts table
  await dbConn.query(`
    CREATE TABLE IF NOT EXISTS receipts (
      id VARCHAR(64) PRIMARY KEY,
      public_id VARCHAR(32) UNIQUE NOT NULL,
      user_id VARCHAR(64) NULL,
      title VARCHAR(255) NOT NULL,
      deliverable TEXT NOT NULL,
      not_included JSON NOT NULL,
      deadline VARCHAR(64) NOT NULL,
      handover_method VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'USD',
      freelancer_name VARCHAR(255) NOT NULL,
      freelancer_email VARCHAR(255),
      client_name VARCHAR(255),
      client_email VARCHAR(255),
      status ENUM('DRAFT', 'AWAITING_CONFIRMATION', 'LOCKED', 'CHANGE_REQUEST', 'CHANGE_APPROVED', 'CHANGE_DECLINED') NOT NULL DEFAULT 'AWAITING_CONFIRMATION',
      created_at DATETIME NOT NULL,
      locked_at DATETIME,
      client_signature VARCHAR(255)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Check if receipts table needs columns/enum updates
  const [receiptCols] = await dbConn.query(`SHOW COLUMNS FROM receipts LIKE 'user_id'`);
  if (receiptCols.length === 0) {
    console.log(`[init-db] Adding 'user_id' column to 'receipts'...`);
    await dbConn.query(`ALTER TABLE receipts ADD COLUMN user_id VARCHAR(64) NULL AFTER public_id`);
  }

  // Update status column enum and convert existing lowercase values
  try {
    await dbConn.query(`ALTER TABLE receipts MODIFY COLUMN status VARCHAR(64) NOT NULL DEFAULT 'AWAITING_CONFIRMATION'`);
    await dbConn.query(`UPDATE receipts SET status = 'LOCKED' WHERE LOWER(status) = 'locked'`);
    await dbConn.query(`UPDATE receipts SET status = 'AWAITING_CONFIRMATION' WHERE LOWER(status) IN ('awaiting', 'awaiting_confirmation')`);
    await dbConn.query(`UPDATE receipts SET status = 'DRAFT' WHERE LOWER(status) = 'draft'`);
    await dbConn.query(`
      ALTER TABLE receipts MODIFY COLUMN status ENUM('DRAFT', 'AWAITING_CONFIRMATION', 'LOCKED', 'CHANGE_REQUEST', 'CHANGE_APPROVED', 'CHANGE_DECLINED') NOT NULL DEFAULT 'AWAITING_CONFIRMATION'
    `);
    console.log(`[init-db] Receipts status column successfully updated to uppercase ENUM.`);
  } catch (err) {
    console.warn(`[init-db] Status column migration note:`, err.message);
  }

  // 7. Create change_requests table
  await dbConn.query(`
    CREATE TABLE IF NOT EXISTS change_requests (
      id VARCHAR(64) PRIMARY KEY,
      receipt_public_id VARCHAR(32) NOT NULL,
      description TEXT NOT NULL,
      additional_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      new_deadline VARCHAR(64),
      status ENUM('PENDING', 'APPROVED', 'DECLINED') DEFAULT 'APPROVED',
      created_at DATETIME NOT NULL,
      approved_at DATETIME,
      CONSTRAINT fk_receipt FOREIGN KEY (receipt_public_id) REFERENCES receipts(public_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  try {
    await dbConn.query(`ALTER TABLE change_requests MODIFY COLUMN status VARCHAR(64) NOT NULL DEFAULT 'APPROVED'`);
    await dbConn.query(`UPDATE change_requests SET status = 'APPROVED' WHERE LOWER(status) = 'approved'`);
    await dbConn.query(`UPDATE change_requests SET status = 'PENDING' WHERE LOWER(status) = 'pending'`);
    await dbConn.query(`UPDATE change_requests SET status = 'DECLINED' WHERE LOWER(status) = 'declined'`);
    await dbConn.query(`
      ALTER TABLE change_requests MODIFY COLUMN status ENUM('PENDING', 'APPROVED', 'DECLINED') NOT NULL DEFAULT 'APPROVED'
    `);
  } catch (err) {
    console.warn(`[init-db] Change request status migration note:`, err.message);
  }

  // 8. Seed default freelancer user
  const DEMO_USER_ID = 'usr_alexchen';
  const DEMO_EMAIL = 'alex@chencreates.io';
  const [existingUser] = await dbConn.query(`SELECT * FROM users WHERE email = ?`, [DEMO_EMAIL]);

  if (existingUser.length === 0) {
    console.log(`[init-db] Seeding default freelancer user (${DEMO_EMAIL})...`);
    const passwordHash = await bcrypt.hash('Password123!', 10);

    await dbConn.query(
      `INSERT INTO users (id, name, email, password_hash, google_id, credits, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [DEMO_USER_ID, 'Alex Chen', DEMO_EMAIL, passwordHash, null, 7]
    );

    // Initial Ledger History for Demo User:
    // +10 credits purchased via Stripe
    await dbConn.query(
      `INSERT INTO credit_transactions (id, user_id, type, credits, stripe_checkout_session_id, stripe_payment_intent_id, receipt_id, created_at)
       VALUES (?, ?, 'purchase', 10, 'cs_demo_initial10', 'pi_demo_initial10', NULL, DATE_SUB(NOW(), INTERVAL 3 DAY))`,
      ['tx_init_purchase_10', DEMO_USER_ID]
    );

    // 3 receipts created (-1 credit each)
    await dbConn.query(
      `INSERT INTO credit_transactions (id, user_id, type, credits, stripe_checkout_session_id, stripe_payment_intent_id, receipt_id, created_at)
       VALUES 
       ('tx_rcpt_1', ?, 'receipt_created', -1, NULL, NULL, 'SR-8XK29', DATE_SUB(NOW(), INTERVAL 2 DAY)),
       ('tx_rcpt_2', ?, 'receipt_created', -1, NULL, NULL, 'SR-9YA14', DATE_SUB(NOW(), INTERVAL 1 DAY)),
       ('tx_rcpt_3', ?, 'receipt_created', -1, NULL, NULL, 'SR-3ML82', DATE_SUB(NOW(), INTERVAL 12 HOUR))`,
      [DEMO_USER_ID, DEMO_USER_ID, DEMO_USER_ID]
    );

    console.log(`[init-db] User Alex Chen seeded with 7 remaining credits & ledger history.`);
  }

  // Update existing receipts to belong to Alex Chen
  await dbConn.query(`UPDATE receipts SET user_id = ? WHERE user_id IS NULL`, [DEMO_USER_ID]);

  console.log(`[init-db] All tables, columns, indexes, and seed data initialized successfully.`);
  await dbConn.end();
}

initDB().catch((err) => {
  console.error('[init-db] Error:', err);
  process.exit(1);
});
