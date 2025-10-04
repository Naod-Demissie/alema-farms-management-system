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

  // Debug logging only in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] Path: ${pathname}, Has Session: ${!!sessionToken}`);
  }

  // Handle root route - always allow landing page to be accessible
  if (isRootRoute) {
    return NextResponse.next();
  }

  // If user is on a protected route and has no session, redirect to signin
  if (isProtectedRoute && !sessionToken) {
    const signInUrl = new URL('/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If user is authenticated and trying to access auth routes, redirect to home
  if (isAuthRoute && sessionToken) {
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
