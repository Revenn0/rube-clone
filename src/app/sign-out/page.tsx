'use client';

import { useEffect } from 'react';
import { useClerk } from '@clerk/nextjs';

export default function SignOutPage() {
  const { signOut } = useClerk();

  useEffect(() => {
    signOut({ redirectUrl: '/' });
  }, [signOut]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-sm text-[#6b7280]">Saindo...</p>
    </div>
  );
}
