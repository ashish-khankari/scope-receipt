import fs from 'fs';
import path from 'path';

// 1. Remove src/app/icon.svg if present to avoid Next.js 14 App Router metadata crash
const appIconSvg = path.join(process.cwd(), 'src', 'app', 'icon.svg');
if (fs.existsSync(appIconSvg)) {
  fs.unlinkSync(appIconSvg);
  console.log('Removed conflicting src/app/icon.svg');
}

// 2. Generate a 32x32 standard Windows ICO file for public/favicon.ico
function createIco(size) {
  const width = size;
  const height = size;
  const bpp = 32;
  const pixelBytes = width * height * 4;
  const andMaskBytes = Math.ceil(width / 32) * 4 * height;
  const headerSize = 40;
  const imageSize = headerSize + pixelBytes + andMaskBytes;
  
  const buffer = Buffer.alloc(22 + imageSize);
  
  // ICONDIR
  buffer.writeUInt16LE(0, 0); // reserved
  buffer.writeUInt16LE(1, 2); // ICO type (1 = icon)
  buffer.writeUInt16LE(1, 4); // 1 image
  
  // ICONDIRENTRY
  buffer.writeUInt8(width === 256 ? 0 : width, 6);
  buffer.writeUInt8(height === 256 ? 0 : height, 7);
  buffer.writeUInt8(0, 8); // color count
  buffer.writeUInt8(0, 9); // reserved
  buffer.writeUInt16LE(1, 10); // color planes
  buffer.writeUInt16LE(bpp, 12); // bits per pixel
  buffer.writeUInt32LE(imageSize, 14); // image size
  buffer.writeUInt32LE(22, 18); // offset to DIB
  
  // BITMAPINFOHEADER
  let offset = 22;
  buffer.writeUInt32LE(40, offset); // biSize
  buffer.writeInt32LE(width, offset + 4); // biWidth
  buffer.writeInt32LE(height * 2, offset + 8); // biHeight (doubled for mask in ICO)
  buffer.writeUInt16LE(1, offset + 12); // biPlanes
  buffer.writeUInt16LE(bpp, offset + 14); // biBitCount
  buffer.writeUInt32LE(0, offset + 16); // biCompression BI_RGB
  buffer.writeUInt32LE(pixelBytes + andMaskBytes, offset + 20); // biSizeImage
  buffer.writeInt32LE(0, offset + 24);
  buffer.writeInt32LE(0, offset + 28);
  buffer.writeUInt32LE(0, offset + 32);
  buffer.writeUInt32LE(0, offset + 36);
  offset += 40;
  
  function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1)**2 + (y2 - y1)**2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  // Draw emerald badge with checkmark (BGRA, bottom-to-top)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const mathY = height - 1 - y;
      const mathX = x;
      
      const r = 5;
      const inCorner = 
        (mathX < r && mathY < r && Math.hypot(mathX - r, mathY - r) > r) ||
        (mathX >= width - r && mathY < r && Math.hypot(mathX - (width - r - 1), mathY - r) > r) ||
        (mathX < r && mathY >= height - r && Math.hypot(mathX - r, mathY - (height - r - 1)) > r) ||
        (mathX >= width - r && mathY >= height - r && Math.hypot(mathX - (width - r - 1), mathY - (height - r - 1)) > r);
      
      const pixelOffset = offset + (y * width + x) * 4;
      
      if (inCorner) {
        // Transparent (BGRA)
        buffer.writeUInt8(0, pixelOffset);
        buffer.writeUInt8(0, pixelOffset + 1);
        buffer.writeUInt8(0, pixelOffset + 2);
        buffer.writeUInt8(0, pixelOffset + 3);
      } else {
        const isBorder = (mathX <= 1 || mathX >= width - 2 || mathY <= 1 || mathY >= height - 2);
        
        // Check mark coordinates in 32x32: (9, 16) -> (14, 21) -> (23, 11)
        const d1 = distToSegment(mathX, mathY, 9, 16, 14, 21);
        const d2 = distToSegment(mathX, mathY, 14, 21, 23, 11);
        const isCheck = (d1 <= 1.5 || d2 <= 1.5);
        
        if (isCheck) {
          // Sharp white / mint checkmark #ffffff
          buffer.writeUInt8(255, pixelOffset);     // B
          buffer.writeUInt8(255, pixelOffset + 1); // G
          buffer.writeUInt8(255, pixelOffset + 2); // R
          buffer.writeUInt8(255, pixelOffset + 3); // A
        } else if (isBorder) {
          // Emerald accent border #10b981
          buffer.writeUInt8(129, pixelOffset);     // B
          buffer.writeUInt8(185, pixelOffset + 1); // G
          buffer.writeUInt8(16, pixelOffset + 2);  // R
          buffer.writeUInt8(255, pixelOffset + 3); // A
        } else {
          // Dark background #0d1218
          buffer.writeUInt8(24, pixelOffset);      // B
          buffer.writeUInt8(18, pixelOffset + 1);  // G
          buffer.writeUInt8(13, pixelOffset + 2);  // R
          buffer.writeUInt8(255, pixelOffset + 3); // A
        }
      }
    }
  }
  
  return buffer;
}

const ico = createIco(32);
fs.writeFileSync(path.join(process.cwd(), 'public', 'favicon.ico'), ico);
console.log('Generated public/favicon.ico successfully!');
