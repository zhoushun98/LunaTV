import { NextRequest } from 'next/server';

const AUTH_COOKIE = 'auth';
const ROLE_COOKIE = 'auth_role';

interface AuthCookie {
  signature?: string;
  timestamp?: number;
  role?: 'owner';
}

function decodeAuthCookie(raw: string | undefined): AuthCookie | null {
  if (!raw) return null;
  try {
    let decoded = decodeURIComponent(raw);
    if (decoded.includes('%')) {
      decoded = decodeURIComponent(decoded);
    }
    return JSON.parse(decoded) as AuthCookie;
  } catch {
    return null;
  }
}

export function getAuthInfoFromCookie(
  request: NextRequest
): AuthCookie | null {
  return decodeAuthCookie(request.cookies.get(AUTH_COOKIE)?.value);
}

async function computeSignature(payload: string): Promise<string> {
  const secret = process.env.PASSWORD;
  if (!secret) throw new Error('PASSWORD not set');

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const buffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// 服务端：为站长签发 auth cookie 内容
export async function signOwnerCookie(timestamp: number): Promise<string> {
  const signature = await computeSignature(`owner|${timestamp}`);
  return encodeURIComponent(
    JSON.stringify({ role: 'owner', signature, timestamp })
  );
}

// 服务端：判断当前请求是否为站长
export async function isOwner(request: NextRequest): Promise<boolean> {
  if (!process.env.PASSWORD) return false;

  const authInfo = getAuthInfoFromCookie(request);
  if (
    !authInfo?.signature ||
    typeof authInfo.timestamp !== 'number' ||
    authInfo.role !== 'owner'
  ) {
    return false;
  }

  try {
    const expected = await computeSignature(`owner|${authInfo.timestamp}`);
    return constantTimeEqual(expected, authInfo.signature);
  } catch {
    return false;
  }
}

// 客户端：仅通过非敏感 auth_role cookie 判断 UI 展示
export function getAuthInfoFromBrowserCookie(): { role?: 'owner' } | null {
  if (typeof window === 'undefined') return null;

  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const trimmed = cookie.trim();
    const eq = trimmed.indexOf('=');
    if (eq > 0) {
      acc[trimmed.substring(0, eq)] = trimmed.substring(eq + 1);
    }
    return acc;
  }, {} as Record<string, string>);

  if (cookies[ROLE_COOKIE] === 'owner') {
    return { role: 'owner' };
  }
  return null;
}
