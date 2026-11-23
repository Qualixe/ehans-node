/** An image accepted for upload: its real type (from the bytes, not the name) and size. */
export interface DetectedImage {
  ext: 'jpg' | 'png' | 'webp';
  mime: 'image/jpeg' | 'image/png' | 'image/webp';
  width: number | null;
  height: number | null;
}

/**
 * Identifies JPEG, PNG and WebP files from their content and reads the pixel size from the
 * header (glowy uses getimagesize()). Anything else returns null, whatever its file name says.
 */
export function detectImage(buf: Buffer): DetectedImage | null {
  // PNG: signature, then the IHDR chunk with width/height
  if (
    buf.length >= 24 &&
    buf.readUInt32BE(0) === 0x89504e47 &&
    buf.readUInt32BE(4) === 0x0d0a1a0a
  ) {
    return {
      ext: 'png',
      mime: 'image/png',
      width: buf.readUInt32BE(16),
      height: buf.readUInt32BE(20),
    };
  }
  // WebP: RIFF....WEBP, then VP8 / VP8L / VP8X
  if (
    buf.length >= 30 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    const chunk = buf.toString('ascii', 12, 16);
    let width: number | null = null;
    let height: number | null = null;
    if (chunk === 'VP8 ') {
      width = buf.readUInt16LE(26) & 0x3fff;
      height = buf.readUInt16LE(28) & 0x3fff;
    } else if (chunk === 'VP8L') {
      const bits = buf.readUInt32LE(21);
      width = (bits & 0x3fff) + 1;
      height = ((bits >> 14) & 0x3fff) + 1;
    } else if (chunk === 'VP8X') {
      width = buf.readUIntLE(24, 3) + 1;
      height = buf.readUIntLE(27, 3) + 1;
    }
    return { ext: 'webp', mime: 'image/webp', width, height };
  }
  // JPEG: SOI marker, then walk the segments to the first SOFn frame header
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    let offset = 2;
    while (offset + 9 < buf.length) {
      if (buf[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buf[offset + 1]!;
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return {
          ext: 'jpg',
          mime: 'image/jpeg',
          height: buf.readUInt16BE(offset + 5),
          width: buf.readUInt16BE(offset + 7),
        };
      }
      offset += 2 + buf.readUInt16BE(offset + 2);
    }
    return { ext: 'jpg', mime: 'image/jpeg', width: null, height: null };
  }
  return null;
}
