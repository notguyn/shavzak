import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

import { PREVIEW_MODE } from "@/lib/preview/flag"

const AUTH_PATHS = ["/login", "/register"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Preview mode: no login wall at all. Auth-only pages just bounce to the app.
  if (PREVIEW_MODE) {
    if (AUTH_PATHS.includes(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return NextResponse.next()
  }

  const sessionCookie = getSessionCookie(request)

  if (sessionCookie && AUTH_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (!sessionCookie && !AUTH_PATHS.includes(pathname)) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackURL", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
