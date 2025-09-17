
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function DemoTestRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/demo-new');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to new demo...</p>
      </div>
    </div>
  );
}