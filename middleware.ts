import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Just pass through - let next-intl handle it via the app
  return NextResponse.next();
}

export const config = {
  // Match all pathnames except for static files and API routes
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};

