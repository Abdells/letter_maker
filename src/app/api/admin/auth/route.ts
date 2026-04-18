import { NextRequest, NextResponse } from 'next/server';

// Store the password only in server-side env — never exposed to the browser.
// Set ADMIN_PASSWORD in your .env.local file:
//   ADMIN_PASSWORD=@#1200=Maara
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(request: NextRequest) {
  console.log('Auth route hit');
  console.log('ENV password:', process.env.ADMIN_PASSWORD);

  if (!ADMIN_PASSWORD) {
    console.error('ADMIN_PASSWORD environment variable is not set.');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const { password } = await request.json();

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true }, { status: 200 });

  // HttpOnly prevents JavaScript from reading the cookie — forgery via console is blocked.
  // Secure ensures cookie is only sent over HTTPS in production.
  // SameSite=Strict blocks cross-site request forgery (CSRF).
  response.cookies.set('admin-auth', ADMIN_PASSWORD, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 1 day in seconds
    path: '/',
  });

  return response;
}
