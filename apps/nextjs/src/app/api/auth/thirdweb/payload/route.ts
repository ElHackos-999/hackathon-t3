import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getThirdwebAuth } from "~/app/utils/thirdwebAuth";

export async function POST(request: NextRequest) {
  try {
    const thirdwebAuth = getThirdwebAuth();
    const { address, chainId } = await request.json();

    const payload = await thirdwebAuth.generatePayload({
      address,
      chainId,
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Payload generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate payload" },
      { status: 500 }
    );
  }
}
