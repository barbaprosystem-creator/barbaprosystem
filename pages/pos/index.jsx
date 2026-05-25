import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function PosIndex() {
  const router = useRouter();
  useEffect(() => { router.replace('/pos/estimator'); }, [router]);
  return null;
}
