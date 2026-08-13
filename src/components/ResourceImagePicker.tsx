import { useEffect, useRef, useState } from 'react';
import defaultResourceImage from '../assets/xp-image-placeholder.svg';
import './ResourceImagePicker.css';

interface ResourceImagePickerProps {
  file?: File;
  imageUrl: string;
  onFileChange: (file: File | undefined) => void;
  onImageUrlChange: (imageUrl: string) => void;
}

export default function ResourceImagePicker({
  file,
  imageUrl,
  onFileChange,
  onImageUrlChange,
}: ResourceImagePickerProps) {
  const [previewUrl, setPreviewUrl] = useState(imageUrl || defaultResourceImage);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(imageUrl || defaultResourceImage);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, imageUrl]);

  useEffect(() => {
    if (!file && fileInputRef.current) fileInputRef.current.value = '';
  }, [file]);

  return (
    <div className="resource-image-picker">
      <img src={previewUrl} alt="Selected resource preview" onError={() => setPreviewUrl(defaultResourceImage)} />
      <div className="resource-image-picker__controls">
        <label>
          <span>Attach Image</span>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onFileChange(event.target.files?.[0])} />
        </label>
        <span className="resource-image-picker__or">or</span>
        <label>
          <span>HTTPS Image URL</span>
          <input type="url" value={imageUrl} onChange={(event) => onImageUrlChange(event.target.value)} placeholder="https://example.com/image.png" />
        </label>
        <small>JPEG, PNG, or WebP; maximum 5 MiB. An attached file takes precedence over the URL.</small>
      </div>
    </div>
  );
}
