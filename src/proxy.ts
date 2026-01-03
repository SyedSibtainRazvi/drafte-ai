import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes (no auth)
const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  // Skip Clerk auth for webhook endpoint
  if (request.nextUrl.pathname.startsWith("/api/webhooks/clerk")) {
    return;
  }

  // Protect everything else except public routes
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Apply proxy/middleware to everything EXCEPT:
    // - api routes (we selectively handle above)
    // - next internals
    "/((?!_next|favicon.ico).*)",
  ],
};
