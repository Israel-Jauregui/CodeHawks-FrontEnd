export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export interface PresignedImageUpload {
  expiresInSeconds: number;
  fields: Record<string, string>;
  uploadId: string;
  uploadUrl: string;
}

export interface PreparedImageUpload {
  file: File;
  wasReencoded: boolean;
}

export function validateImageFile(file: File | undefined): string | null {
  if (!file) return null;
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as (typeof SUPPORTED_IMAGE_TYPES)[number])) {
    return 'Choose a JPEG, PNG, or WebP image.';
  }
  if (file.size > MAX_IMAGE_BYTES) return 'Images must be 5 MiB or smaller.';
  return null;
}

function canvasBlob(canvas: HTMLCanvasElement, contentType: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, contentType, quality));
}

/**
 * Decoding into a canvas and creating a new image removes metadata that is not
 * part of the rendered pixels (for example, most EXIF and GPS fields). This is
 * intentionally described as best effort: browser codec support varies, and
 * the API must still treat the upload as untrusted input.
 */
export async function prepareImageForUpload(file: File): Promise<PreparedImageUpload> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const maximumDimension = 2560;
    const scale = Math.min(1, maximumDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close();
      return { file, wasReencoded: false };
    }

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const outputType = file.type === 'image/png' ? 'image/png' : 'image/webp';
    const output = await canvasBlob(canvas, outputType, outputType === 'image/webp' ? 0.9 : undefined);
    if (!output || output.size === 0 || output.size > MAX_IMAGE_BYTES) {
      return { file, wasReencoded: false };
    }

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'codehawks-image';
    const extension = outputType === 'image/png' ? 'png' : 'webp';
    return {
      file: new File([output], `${baseName}.${extension}`, { type: outputType, lastModified: Date.now() }),
      wasReencoded: true,
    };
  } catch {
    return { file, wasReencoded: false };
  }
}

export async function uploadWithPresignedPost(upload: PresignedImageUpload, file: File) {
  const formData = new FormData();
  Object.entries(upload.fields).forEach(([key, value]) => formData.append(key, value));
  formData.append('file', file);

  const response = await fetch(upload.uploadUrl, { method: 'POST', body: formData });
  if (!response.ok) {
    throw new Error('The image upload failed. Please choose the file and try again.');
  }
}
