import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#0a0a0a] mb-2">Welcome back</h1>
          <p className="text-sm text-[#6b7280]">Sign in to continue to Rube</p>
        </div>
        <SignIn appearance={{ elements: { rootBox: 'mx-auto', card: 'shadow-lg border border-[#e5e7eb] rounded-xl', formButtonPrimary: 'bg-[#f26522] hover:bg-[#e55a1d]' } }} />
      </div>
    </div>
  );
}
