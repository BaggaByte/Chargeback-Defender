import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/login');
  const isLandingPage = req.nextUrl.pathname.startsWith('/landing');

  // Allow API routes to handle their own auth checks
  if (req.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Allow landing page to be viewed publicly
  if (isLandingPage) {
    return NextResponse.next();
  }

  // Redirect to dashboard if logged in and on login page
  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/', req.nextUrl));
    }
    return NextResponse.next();
  }

  // Redirect to landing page if not logged in and visiting home, or to login if visiting dashboard subroutes
  if (!isLoggedIn) {
    if (req.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/landing', req.nextUrl));
    }
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
