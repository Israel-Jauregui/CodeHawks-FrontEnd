export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export interface PresignedImageUpload {
  fields: Record<string, string>;
  publicUrl: string;
  uploadUrl: string;
}

export function validateImageFile(file: File | undefined): string | null {
  if (!file) return null;
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as (typeof SUPPORTED_IMAGE_TYPES)[number])) {
    return 'Choose a JPEG, PNG, or WebP image.';
  }
  if (file.size > MAX_IMAGE_BYTES) return 'Images must be 5 MiB or smaller.';
  return null;
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
