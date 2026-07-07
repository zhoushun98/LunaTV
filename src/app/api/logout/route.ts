import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set('auth', '', {
    path: '/',
    expires: new Date(0),
    sameSite: 'lax',
    httpOnly: true,
  });
  response.cookies.set('auth_role', '', {
    path: '/',
    expires: new Date(0),
    sameSite: 'lax',
  });

  return response;
}
