'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function TripPage() {
  const params = useParams();
  const router = useRouter();
  
  useEffect(() => {
    router.replace(`/trip/${params.id}/overview`);
  }, [params.id, router]);
  
  return null;
}
