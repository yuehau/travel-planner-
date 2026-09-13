import { useState, type ImgHTMLAttributes } from 'react';
import { googlePhotoUrl } from '../services/publicApi';
import { useGooglePhotos } from '../hooks/useGooglePhotos';

type PlaceImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  catalogId: string | null | undefined;
  /** Illustration (or any local image) used when Google photos are off or fail. */
  fallback: string | null | undefined;
  width?: number;
};

/** Shows the live Google photo for a catalog place when configured, otherwise the illustration. */
const PlaceImage = ({ catalogId, fallback, width = 800, alt = '', ...props }: PlaceImageProps) => {
  const googleEnabled = useGooglePhotos();
  const preferGoogle = googleEnabled && Boolean(catalogId);
  // Remember which photo failed so a new catalogId gets a fresh attempt without an effect.
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const photoKey = `${catalogId ?? ''}:${width}`;
  const useFallback = !preferGoogle || failedKey === photoKey;

  const src = !useFallback && catalogId ? googlePhotoUrl(catalogId, width) : fallback ?? undefined;

  if (!src) {
    return <div className="flex h-full w-full items-center justify-center bg-surface-sunken text-xs text-ink-faint">No image</div>;
  }

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      loading={props.loading ?? 'lazy'}
      onError={() => {
        if (!useFallback) setFailedKey(photoKey);
      }}
    />
  );
};

export default PlaceImage;
