"use server";

import type { VerifyLoginPayloadParams } from "thirdweb/auth";
import { cookies } from "next/headers";
import dotenv from "dotenv";
import { createAuth } from "thirdweb/auth";
import { getProfiles, privateKeyToAccount } from "thirdweb/wallets";

import { eq } from "@acme/db";
import { db } from "@acme/db/client";
import { User } from "@acme/db/schema";

import { client } from "~/app/utils/thirdwebClient";
import { env } from "~/env";

dotenv.config();

function getThirdwebAuth() {
  const secretKey = env.PRIVATE_KEY;
  const appUrl = env.VERCEL_URL || "localhost:3000";

  if (!secretKey || !appUrl) {
    throw new Error(
      `Missing required environment variables: PRIVATE_KEY=${!!secretKey}, VERCEL_URL=${!!appUrl}`,
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

  const walletAddress = verifiedPayload.payload.address;

  // Check if user exists in database
  const existingUser = await db
    .select()
    .from(User)
    .where(eq(User.walletAddress, walletAddress))
    .limit(1);

  const profiles = await getProfiles({ client });

  let email;
  let name;

  if (profiles.length > 0) {
    // @ts-expect-error -- ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    name = profiles[0]?.details.name || `User-${walletAddress.substring(0, 6)}`;
    email = profiles[0]?.details.email;
  }

  // Create user if they don't exist
  if (existingUser.length === 0) {
    await db.insert(User).values({
      walletAddress,
      name: name || `User-${walletAddress.substring(0, 6)}`,
      email: email || "",
      role: "admin",
    });

    // Call the mint function to give users some test NFTs
  }

  const jwt = await thirdwebAuth.generateJWT({
    payload: verifiedPayload.payload,
  });

  const cookieStore = await cookies();
  cookieStore.set("jwt", jwt, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
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

    const walletAddress = authResult.parsedJWT.sub;

    // Fetch user from database
    const users = await db
      .select()
      .from(User)
      .where(eq(User.walletAddress, walletAddress))
      .limit(1);

    const user = users[0];

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      walletAddress: user.walletAddress,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  } catch {
    return null;
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set("jwt", "", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
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
