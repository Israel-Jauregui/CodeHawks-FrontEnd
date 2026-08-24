import { useEffect, useRef, useState } from 'react';
import defaultResourceImage from '../assets/xp-image-placeholder.svg';
import './ResourceImagePicker.css';

interface ResourceImagePickerProps {
  file?: File;
  onFileChange: (file: File | undefined) => void;
}

export default function ResourceImagePicker({
  file,
  onFileChange,
}: ResourceImagePickerProps) {
  const [previewUrl, setPreviewUrl] = useState(defaultResourceImage);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(defaultResourceImage);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    if (!file && fileInputRef.current) fileInputRef.current.value = '';
  }, [file]);

  return (
    <div className="resource-image-picker">
      <img src={previewUrl} alt={file ? 'Selected image preview' : 'No image selected'} onError={() => setPreviewUrl(defaultResourceImage)} />
      <div className="resource-image-picker__controls">
        <label>
          <span>Attach Image</span>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onFileChange(event.target.files?.[0])} />
        </label>
        <small>
          JPEG, PNG, or WebP; maximum 5 MiB. Images must use the controlled CodeHawks upload. The browser attempts
          to re-encode and remove embedded metadata; if the browser cannot, the original file may be uploaded. The
          server quarantines the upload, checks its size, type, and file signature, then publishes a separate
          finalized object. It does not guarantee metadata removal.
        </small>
      </div>
    </div>
  );
}
