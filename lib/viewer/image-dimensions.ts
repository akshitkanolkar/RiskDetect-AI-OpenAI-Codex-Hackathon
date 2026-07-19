/** Lightweight image dimension reader (no native deps). */
export function readImageDimensions(
  buffer: Buffer,
  mimeType: string,
): { width: number; height: number } {
  try {
    if (mimeType === "image/png" || buffer[0] === 0x89) {
      if (buffer.length >= 24) {
        return {
          width: buffer.readUInt32BE(16),
          height: buffer.readUInt32BE(20),
        };
      }
    }

    if (
      mimeType === "image/jpeg" ||
      mimeType === "image/jpg" ||
      (buffer[0] === 0xff && buffer[1] === 0xd8)
    ) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) break;
        const marker = buffer[offset + 1];
        const length = buffer.readUInt16BE(offset + 2);
        // SOF0–SOF3, SOF5–SOF7, SOF9–SOF11, SOF13–SOF15
        if (
          (marker >= 0xc0 && marker <= 0xc3) ||
          (marker >= 0xc5 && marker <= 0xc7) ||
          (marker >= 0xc9 && marker <= 0xcb) ||
          (marker >= 0xcd && marker <= 0xcf)
        ) {
          return {
            height: buffer.readUInt16BE(offset + 5),
            width: buffer.readUInt16BE(offset + 7),
          };
        }
        offset += 2 + length;
      }
    }

    if (mimeType === "image/webp" && buffer.toString("ascii", 0, 4) === "RIFF") {
      // VP8X
      if (buffer.toString("ascii", 12, 16) === "VP8X" && buffer.length >= 30) {
        const width = 1 + buffer[24] + (buffer[25] << 8) + (buffer[26] << 16);
        const height = 1 + buffer[27] + (buffer[28] << 8) + (buffer[29] << 16);
        return { width, height };
      }
      // VP8 lossy
      if (buffer.toString("ascii", 12, 16) === "VP8 " && buffer.length >= 30) {
        return {
          width: buffer.readUInt16LE(26) & 0x3fff,
          height: buffer.readUInt16LE(28) & 0x3fff,
        };
      }
    }
  } catch {
    // fall through
  }
  return { width: 0, height: 0 };
}
