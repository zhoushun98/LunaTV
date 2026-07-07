/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';

import { signOwnerCookie } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const envPassword = process.env.PASSWORD;

    if (!envPassword) {
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

    const { password } = await req.json();
    if (typeof password !== 'string') {
      return NextResponse.json({ error: '密码不能为空' }, { status: 400 });
    }

    if (password !== envPassword) {
      return NextResponse.json(
        { ok: false, error: '密码错误' },
        { status: 401 }
      );
    }

    const timestamp = Date.now();
    const cookieValue = await signOwnerCookie(timestamp);
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    const secure = process.env.NODE_ENV === 'production';

    const response = NextResponse.json({ ok: true });
    response.cookies.set('auth', cookieValue, {
      path: '/',
      expires,
      sameSite: 'lax',
      httpOnly: true,
      secure,
    });
    // 非敏感的角色标识 cookie，仅供前端 UI 判断是否显示"管理面板/登出"
    response.cookies.set('auth_role', 'owner', {
      path: '/',
      expires,
      sameSite: 'lax',
      httpOnly: false,
      secure,
    });

    return response;
  } catch (error) {
    console.error('登录接口异常', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
