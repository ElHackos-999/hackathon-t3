import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getThirdwebAuth } from "~/app/utils/thirdwebAuth";

export async function POST(request: NextRequest) {
  try {
    const thirdwebAuth = getThirdwebAuth();
    const payload = await request.json();
    const verifiedPayload = await thirdwebAuth.verifyPayload(payload);

    if (!verifiedPayload.valid) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 401 });
    }

    const jwt = await thirdwebAuth.generateJWT({
      payload: verifiedPayload.payload,
    });

    const response = NextResponse.json({ token: jwt });

    // Set the JWT as an HTTP-only cookie
    response.cookies.set("jwt", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
