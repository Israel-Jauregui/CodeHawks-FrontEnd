import { useEffect, useState } from 'react';
import defaultResourceImage from '../assets/xp-image-placeholder.svg';
import './ResourceImage.css';

interface ResourceImageProps {
  imageUrl?: string;
  alt: string;
  className?: string;
}

export default function ResourceImage({ imageUrl, alt, className = '' }: ResourceImageProps) {
  const [source, setSource] = useState(imageUrl || defaultResourceImage);

  useEffect(() => setSource(imageUrl || defaultResourceImage), [imageUrl]);

  return (
    <img
      className={`resource-image ${className}`.trim()}
      src={source}
      alt={imageUrl ? alt : `${alt} — no image attached`}
      onError={() => setSource(defaultResourceImage)}
    />
  );
}
