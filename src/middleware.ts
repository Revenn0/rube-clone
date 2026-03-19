import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/sign-out',
  '/chat(.*)',
  '/apps(.*)',
  '/workflows(.*)',
  '/schedule(.*)',
  '/projects(.*)',
  '/use-rube(.*)',
  '/use-jungor(.*)',
  '/settings(.*)',
  '/api/workflows(.*)',
  '/api/cron(.*)',
  '/api/composio/connect(.*)',
  '/api/composio/callback(.*)',
  '/api/executions(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // /api/cron/run is called by Vercel Cron - skip Clerk auth (uses CRON_SECRET)
  if (req.nextUrl.pathname === '/api/cron/run') {
    return NextResponse.next();
  }

  // Redirect /recipes and /workflows to /schedule
  const url = req.nextUrl.clone();
  if (url.pathname.startsWith('/recipes')) {
    url.pathname = url.pathname.replace(/^\/recipes/, '/schedule');
    return NextResponse.redirect(url);
  }
  if (url.pathname.startsWith('/workflows')) {
    url.pathname = url.pathname.replace(/^\/workflows/, '/schedule');
    return NextResponse.redirect(url);
  }
  if (url.pathname.startsWith('/use-rube')) {
    url.pathname = url.pathname.replace(/^\/use-rube/, '/use-jungor');
    return NextResponse.redirect(url);
  }
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
