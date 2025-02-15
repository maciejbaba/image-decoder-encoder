import { readFileSync, writeFileSync } from 'fs';

enum ImageFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  GIF = 'gif',
  BMP = 'bmp',
  WEBP = 'webp',
  SVG = 'svg',
}

interface ImageDimensions {
  width: number;
  height: number;
}

interface DecodedImage extends ImageDimensions {
  format: ImageFormat;
  dataUrl: string;
}

type FormatSignatures = {
  readonly [key in ImageFormat]: readonly number[];
};

interface ImageDecoderInterface {
  readonly formatSignatures: FormatSignatures;
}

class ImageDecoder implements ImageDecoderInterface {
  readonly formatSignatures = Object.freeze({
    [ImageFormat.JPEG]: [0xff, 0xd8, 0xff],
    [ImageFormat.PNG]: [0x89, 0x50, 0x4e, 0x47],
    [ImageFormat.GIF]: [0x47, 0x49, 0x46, 0x38],
    [ImageFormat.BMP]: [0x42, 0x4d],
    [ImageFormat.WEBP]: [0x52, 0x49, 0x46, 0x46],
    [ImageFormat.SVG]: [0x3c, 0x73, 0x76, 0x67],
  });

  createHtmlWithImage(image: DecodedImage): void {
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>Decoded Image</title>
    <style>
        body {
            display: flex;
            flex-direction: column;
            align-items: center;
            font-family: Arial, sans-serif;
        }
        img {
            max-width: 100%;
            margin: 20px 0;
        }
        .info {
            background: #f0f0f0;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="info">
        <p>Format: ${image.format}</p>
        <p>Dimensions: ${image.width}x${image.height}</p>
    </div>
    <img src="${image.dataUrl}" alt="Decoded image">
</body>
</html>`;

    writeFileSync('decoded.html', html);
  }

  detectFormat(bytes: Uint8Array): ImageFormat | null {
    for (const [format, signature] of Object.entries(this.formatSignatures)) {
      if (this.matchesSignature(bytes, signature)) {
        return format as ImageFormat;
      }
    }
    return null;
  }

  matchesSignature(bytes: Uint8Array, signature: readonly number[]): boolean {
    return signature.every((byte, index) => bytes[index] === byte);
  }

  decodeDimensions(
    bytes: Uint8Array,
    format: ImageFormat
  ): ImageDimensions | null {
    const map = {
      [ImageFormat.JPEG]: this.decodeJpegDimensions,
      [ImageFormat.PNG]: this.decodePngDimensions,
      [ImageFormat.GIF]: this.decodeGifDimensions,
      [ImageFormat.BMP]: this.decodeBmpDimensions,
      [ImageFormat.WEBP]: this.decodeWebpDimensions,
      [ImageFormat.SVG]: this.decodeSvgDimensions,
    };
    return map[format](bytes) ?? null;
  }

  decodeSvgDimensions(bytes: Uint8Array): ImageDimensions | null {
    try {
      const text = new TextDecoder().decode(bytes);
      // Try viewBox first
      const viewBoxMatch = text.match(/viewBox=["']([^"']+)["']/);
      if (viewBoxMatch) {
        const [width, height] = viewBoxMatch[1].split(/[\s,]+/).map(Number);
        return { width, height };
      }
      // Try width/height attributes
      const widthMatch = text.match(/width=["'](\d+)/);
      const heightMatch = text.match(/height=["'](\d+)/);
      if (widthMatch && heightMatch) {
        return {
          width: parseInt(widthMatch[1]),
          height: parseInt(heightMatch[1]),
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  decodeWebpDimensions(bytes: Uint8Array): ImageDimensions | null {
    if (bytes.length < 30) return null;

    // Check for VP8X (extended WebP)
    if (
      bytes[12] === 0x56 &&
      bytes[13] === 0x50 &&
      bytes[14] === 0x38 &&
      bytes[15] === 0x58
    ) {
      // VP8X format
      return {
        width: 1 + ((bytes[24] << 16) | (bytes[23] << 8) | bytes[22]),
        height: 1 + ((bytes[27] << 16) | (bytes[26] << 8) | bytes[25]),
      };
    }

    // Check for VP8 (lossy WebP)
    if (
      bytes[12] === 0x56 &&
      bytes[13] === 0x50 &&
      bytes[14] === 0x38 &&
      bytes[15] === 0x20
    ) {
      return {
        width: (bytes[26] | (bytes[27] << 8)) & 0x3fff,
        height: (bytes[28] | (bytes[29] << 8)) & 0x3fff,
      };
    }

    // Check for VP8L (lossless WebP)
    if (
      bytes[12] === 0x56 &&
      bytes[13] === 0x50 &&
      bytes[14] === 0x38 &&
      bytes[15] === 0x4c
    ) {
      const bits =
        (bytes[21] << 24) | (bytes[20] << 16) | (bytes[19] << 8) | bytes[18];
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }

    return null;
  }

  decodeJpegDimensions(bytes: Uint8Array): ImageDimensions | null {
    let offset = 2; // Skip JPEG signature
    while (offset < bytes.length) {
      if (bytes[offset] !== 0xff) {
        return null;
      }
      const marker = bytes[offset + 1];
      if (marker === 0xc0 || marker === 0xc2) {
        return {
          height: (bytes[offset + 5] << 8) | bytes[offset + 6],
          width: (bytes[offset + 7] << 8) | bytes[offset + 8],
        };
      }
      offset += 2 + ((bytes[offset + 2] << 8) | bytes[offset + 3]);
    }
    return null;
  }

  decodePngDimensions(bytes: Uint8Array): ImageDimensions | null {
    if (bytes.length < 24) return null;

    return {
      width:
        (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19],
      height:
        (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23],
    };
  }

  decodeGifDimensions(bytes: Uint8Array): ImageDimensions | null {
    if (bytes.length < 10) return null;

    return {
      width: bytes[6] | (bytes[7] << 8),
      height: bytes[8] | (bytes[9] << 8),
    };
  }

  decodeBmpDimensions(bytes: Uint8Array): ImageDimensions | null {
    if (bytes.length < 26) return null;

    return {
      width:
        bytes[18] | (bytes[19] << 8) | (bytes[20] << 16) | (bytes[21] << 24),
      height:
        bytes[22] | (bytes[23] << 8) | (bytes[24] << 16) | (bytes[25] << 24),
    };
  }

  toBase64(bytes: Uint8Array, format: ImageFormat): string {
    const base64 = Buffer.from(bytes).toString('base64');
    return `data:image/${format};base64,${base64}`;
  }

  decode(bytes: Uint8Array): DecodedImage {
    const format = this.detectFormat(bytes);
    if (!format) {
      throw new Error('Unsupported or invalid image format');
    }

    const dimensions = this.decodeDimensions(bytes, format);
    if (!dimensions) {
      throw new Error('Failed to decode image dimensions');
    }

    return {
      format,
      width: dimensions.width,
      height: dimensions.height,
      dataUrl: this.toBase64(bytes, format),
    };
  }
}

// Example usage with types:
const decoder = new ImageDecoder();

async function decodeImageFile(file: File): Promise<DecodedImage> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  try {
    const decoded = decoder.decode(bytes);
    return decoded;
  } catch (error) {
    throw new Error(
      `Failed to decode image: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

(async () => {
  const image = readFileSync('./test.jpg');
  const imageFile = new File([image], 'test.jpg', { type: 'image/jpeg' });
  const decoded = await decodeImageFile(imageFile);
  console.log(decoded);
  decoder.createHtmlWithImage(decoded);
})();
