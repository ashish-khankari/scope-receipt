import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST() {
  try {
    // Run schema creation raw queries
    await query(`
      CREATE TABLE IF NOT EXISTS receipts (
        id VARCHAR(64) PRIMARY KEY,
        public_id VARCHAR(32) UNIQUE NOT NULL,
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
        status ENUM('draft', 'awaiting', 'locked') DEFAULT 'awaiting',
        created_at DATETIME NOT NULL,
        locked_at DATETIME,
        client_signature VARCHAR(255)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS change_requests (
        id VARCHAR(64) PRIMARY KEY,
        receipt_public_id VARCHAR(32) NOT NULL,
        description TEXT NOT NULL,
        additional_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        new_deadline VARCHAR(64),
        status ENUM('pending', 'approved', 'declined') DEFAULT 'approved',
        created_at DATETIME NOT NULL,
        approved_at DATETIME,
        CONSTRAINT fk_receipt FOREIGN KEY (receipt_public_id) REFERENCES receipts(public_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    return NextResponse.json({ success: true, message: 'Database initialized successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
