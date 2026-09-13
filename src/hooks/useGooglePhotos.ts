import { useEffect, useState } from 'react';
import { fetchConfig } from '../services/publicApi';

let cachedEnabled: boolean | null = null;

/** Whether the local server can serve Google place photos. Resolved once per page load. */
export const useGooglePhotos = () => {
  const [enabled, setEnabled] = useState<boolean>(cachedEnabled ?? false);

  useEffect(() => {
    if (cachedEnabled !== null) return;
    let isMounted = true;
    fetchConfig().then((config) => {
      cachedEnabled = config.googlePhotos;
      if (isMounted) setEnabled(config.googlePhotos);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return enabled;
};
