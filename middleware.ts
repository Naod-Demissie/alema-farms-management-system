import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define protected routes (dashboard routes)
  const protectedRoutes = [
    '/home',
    '/staff',
    '/flocks',
    '/production',
    '/feed',
    '/health',
    '/financial',
    '/reports',
    '/settings'
  ];

  // Define auth routes (where authenticated users shouldn't go)
  const authRoutes = ['/signin', '/forgot-password', '/reset-password'];

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  const isRootRoute = pathname === '/';

  // Skip middleware for API routes, static files, and images
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get session token from cookies - try multiple possible cookie names
  const sessionToken = request.cookies.get('better-auth.session_token') || 
                      request.cookies.get('session_token') ||
                      request.cookies.get('better-auth.session');

  // Debug logging (remove in production)
  console.log(`[Middleware] Path: ${pathname}, Has Session: ${!!sessionToken}, Is Root: ${isRootRoute}, Is Protected: ${isProtectedRoute}, Is Auth: ${isAuthRoute}`);

  // Handle root route redirects
  if (isRootRoute) {
    if (sessionToken) {
      // If user is authenticated and visits root, redirect to home
      console.log(`[Middleware] Redirecting authenticated user from root to /home`);
      return NextResponse.redirect(new URL('/home', request.url));
    } else {
      // If user is not authenticated and visits root, redirect to signin
      console.log(`[Middleware] Redirecting unauthenticated user from root to /signin`);
      return NextResponse.redirect(new URL('/signin', request.url));
    }
  }

  // If user is on a protected route and has no session, redirect to signin
  if (isProtectedRoute && !sessionToken) {
    const signInUrl = new URL('/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    console.log(`[Middleware] Redirecting to signin with callback: ${pathname}`);
    return NextResponse.redirect(signInUrl);
  }

  // If user is authenticated and trying to access auth routes, redirect to home
  if (isAuthRoute && sessionToken) {
    console.log(`[Middleware] Redirecting authenticated user from auth route to /home`);
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
