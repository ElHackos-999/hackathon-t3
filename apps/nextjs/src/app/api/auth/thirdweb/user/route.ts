import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getThirdwebAuth } from "~/app/utils/thirdwebAuth";

export async function GET(request: NextRequest) {
  try {
    const jwt = request.cookies.get("jwt")?.value;

    if (!jwt) {
      return NextResponse.json({ user: null });
    }

    const thirdwebAuth = getThirdwebAuth();
    const authResult = await thirdwebAuth.verifyJWT({ jwt });

    if (!authResult.valid) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        address: authResult.parsedJWT.sub,
      },
    });
  } catch (error) {
    console.error("User verification error:", error);
    return NextResponse.json({ user: null });
  }
}
