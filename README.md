# Image Decoder/Encoder

A TypeScript library for decoding image files, extracting metadata, and converting images to various formats. Supports multiple image formats including JPEG, PNG, GIF, BMP, WEBP, and SVG.

## Features

- **Multi-format Support**: Decode JPEG, PNG, GIF, BMP, WEBP, and SVG images
- **Format Detection**: Automatically detect image format using file signatures (magic bytes)
- **Dimension Extraction**: Extract width and height from image files
- **Base64 Conversion**: Convert images to base64 data URLs
- **HTML Generation**: Create HTML files to display decoded images
- **TypeScript Support**: Full TypeScript support with type definitions

## Installation

1. Clone the repository:
```bash
git clone https://github.com/maciejbaba/image-decoder-encoder.git
cd image-decoder-encoder
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Basic Usage

```typescript
import { ImageDecoder } from './index';
import { readFileSync } from 'fs';

const decoder = new ImageDecoder();

// Decode an image file
const imageBuffer = readFileSync('./path/to/image.jpg');
const imageBytes = new Uint8Array(imageBuffer);

try {
  const decodedImage = decoder.decode(imageBytes);
  console.log(decodedImage);
  // Output: { format: 'jpeg', width: 1920, height: 1080, dataUrl: 'data:image/jpeg;base64,...' }
} catch (error) {
  console.error('Failed to decode image:', error.message);
}
```

### Generate HTML Display

```typescript
// Create an HTML file to display the decoded image
decoder.createHtmlWithImage(decodedImage);
// This creates 'decoded.html' in the current directory
```

### Working with File Objects

```typescript
async function decodeImageFile(file: File): Promise<DecodedImage> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  try {
    const decoded = decoder.decode(bytes);
    return decoded;
  } catch (error) {
    throw new Error(`Failed to decode image: ${error.message}`);
  }
}
```

## API Reference

### Classes

#### `ImageDecoder`

The main class for decoding images and extracting metadata.

##### Methods

- **`decode(bytes: Uint8Array): DecodedImage`**
  - Decodes an image and returns format, dimensions, and base64 data URL
  - Throws an error if the format is unsupported or decoding fails

- **`detectFormat(bytes: Uint8Array): ImageFormat | null`**
  - Detects the image format based on file signature
  - Returns the detected format or null if unsupported

- **`decodeDimensions(bytes: Uint8Array, format: ImageFormat): ImageDimensions | null`**
  - Extracts width and height from the image data
  - Returns dimensions object or null if extraction fails

- **`toBase64(bytes: Uint8Array, format: ImageFormat): string`**
  - Converts image bytes to a base64 data URL
  - Returns a complete data URL string

- **`createHtmlWithImage(image: DecodedImage): void`**
  - Generates an HTML file displaying the decoded image
  - Creates 'decoded.html' in the current directory

### Interfaces

#### `DecodedImage`

```typescript
interface DecodedImage {
  format: ImageFormat;
  width: number;
  height: number;
  dataUrl: string;
}
```

#### `ImageDimensions`

```typescript
interface ImageDimensions {
  width: number;
  height: number;
}
```

### Enums

#### `ImageFormat`

```typescript
enum ImageFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  GIF = 'gif',
  BMP = 'bmp',
  WEBP = 'webp',
  SVG = 'svg'
}
```

## Supported Formats

| Format | File Signature | Dimension Support |
|--------|---------------|-------------------|
| JPEG   | `FF D8 FF`    | ✅ |
| PNG    | `89 50 4E 47` | ✅ |
| GIF    | `47 49 46 38` | ✅ |
| BMP    | `42 4D`       | ✅ |
| WEBP   | `52 49 46 46` | ✅ (VP8/VP8X) |
| SVG    | `3C 73 76 67` | ✅ (viewBox/attributes) |

## Running the Example

The project includes an example that processes `test.jpg`:

```bash
npx ts-node index.ts
```

This will:
1. Read the test image file
2. Decode its format and dimensions
3. Log the decoded information
4. Generate `decoded.html` for viewing

## Development

### Scripts

```bash
# Run the example
npm start

# Run tests (when available)
npm test
```

### TypeScript Configuration

The project uses strict TypeScript settings defined in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

ISC License

## Repository

- **GitHub**: [maciejbaba/image-decoder-encoder](https://github.com/maciejbaba/image-decoder-encoder)
- **Issues**: [Report bugs or request features](https://github.com/maciejbaba/image-decoder-encoder/issues)

---

*Note: This library focuses on metadata extraction and format detection. For advanced image processing operations, consider using additional libraries like Sharp or Canvas.*