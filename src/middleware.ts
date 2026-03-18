import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/chat(.*)',
  '/apps(.*)',
  '/workflows(.*)',
  '/settings(.*)',
  '/api/workflows(.*)',
  '/api/cron(.*)',
  '/api/composio/connect(.*)',
  '/api/composio/callback(.*)',
  '/api/executions(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
