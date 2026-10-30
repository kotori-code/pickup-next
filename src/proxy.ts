import { NextResponse, type NextRequest } from "next/server";
import {
  isValidSession,
  MEMBER_COOKIE,
  normalizeMember,
  SESSION_COOKIE,
} from "@/lib/auth";

// 合言葉の Cookie がなければ /login へ、名前がなければ /name へ移す
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/login") return NextResponse.next();

  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (!(await isValidSession(session, process.env.APP_PASSWORD))) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if (
    pathname !== "/name" &&
    !normalizeMember(request.cookies.get(MEMBER_COOKIE)?.value)
  ) {
    return NextResponse.redirect(new URL("/name", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // 画像・CSS・JS などの静的ファイルは通す
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|sw.js|manifest.webmanifest|.*\\.(?:png|svg|jpg|ico|webmanifest)$).*)",
  ],
};
