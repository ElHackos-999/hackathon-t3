"use server";

import type { VerifyLoginPayloadParams } from "thirdweb/auth";
import { cookies } from "next/headers";
import dotenv from "dotenv";
import { createAuth } from "thirdweb/auth";
import { privateKeyToAccount } from "thirdweb/wallets";

import { client } from "~/app/utils/thirdwebClient";
import { env } from "~/env";

dotenv.config();

function getThirdwebAuth() {
  const secretKey = env.PRIVATE_KEY;
  const appUrl = env.NEXT_PUBLIC_APP_URL;

  if (!secretKey || !appUrl) {
    throw new Error(
      `Missing required environment variables: PRIVATE_KEY=${!!secretKey}, NEXT_PUBLIC_APP_URL=${!!appUrl}`,
    );
  }

  return createAuth({
    domain: appUrl,
    client,
    adminAccount: privateKeyToAccount({
      client,
      privateKey: secretKey,
    }),
  });
}

export async function generateLoginPayload(address: string, chainId?: number) {
  const thirdwebAuth = getThirdwebAuth();

  return thirdwebAuth.generatePayload({
    address,
    chainId,
  });
}

export async function login(payload: VerifyLoginPayloadParams) {
  const thirdwebAuth = getThirdwebAuth();
  const verifiedPayload = await thirdwebAuth.verifyPayload(payload);

  if (!verifiedPayload.valid) {
    throw new Error("Invalid payload");
  }

  const jwt = await thirdwebAuth.generateJWT({
    payload: verifiedPayload.payload,
  });

  const cookieStore = await cookies();
  cookieStore.set("jwt", jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return { token: jwt };
}

export async function isLoggedIn() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value;

  if (!jwt) {
    return false;
  }

  try {
    const thirdwebAuth = getThirdwebAuth();
    const authResult = await thirdwebAuth.verifyJWT({ jwt });
    return authResult.valid;
  } catch {
    return false;
  }
}

export async function getUser() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value;

  if (!jwt) {
    return null;
  }

  try {
    const thirdwebAuth = getThirdwebAuth();
    const authResult = await thirdwebAuth.verifyJWT({ jwt });

    if (!authResult.valid) {
      return null;
    }

    return {
      address: authResult.parsedJWT.sub,
    };
  } catch {
    return null;
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set("jwt", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  return { success: true };
}

/**
 * Get the authenticated user or throw an error.
 * Use this in protected server actions.
 */
export async function requireAuth() {
  const user = await getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
