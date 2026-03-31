import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/settings(.*)",
  "/api/skills(.*)",
  "/api/automations(.*)",
  "/api/billing(.*)",
  "/api/connect(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();

  const { pathname } = req.nextUrl;
  if (pathname === "/") {
    const { userId } = await auth();
    if (!userId) {
      const url = req.nextUrl.clone();
      url.pathname = "/home";
      return NextResponse.rewrite(url);
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)"
  ]
};
