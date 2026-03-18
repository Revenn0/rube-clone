import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/sign-out',
  '/chat(.*)',
  '/apps(.*)',
  '/workflows(.*)',
  '/schedule(.*)',
  '/use-rube(.*)',
  '/settings(.*)',
  '/api/workflows(.*)',
  '/api/cron(.*)',
  '/api/composio/connect(.*)',
  '/api/composio/callback(.*)',
  '/api/executions(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Redirect /recipes to /schedule
  const url = req.nextUrl.clone();
  if (url.pathname.startsWith('/recipes')) {
    url.pathname = url.pathname.replace(/^\/recipes/, '/schedule');
    return Response.redirect(url);
  }
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
