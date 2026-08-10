import { useEffect, useState } from 'react';

import { getProfileAvatarSignedUrl } from '@/lib/profile/avatar-storage';

export function useProfileAvatarUrl(storagePath: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!storagePath) {
      setUrl(null);
      return;
    }

    let cancelled = false;

    void getProfileAvatarSignedUrl(storagePath).then((signedUrl) => {
      if (!cancelled) {
        setUrl(signedUrl);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [storagePath]);

  return url;
}
