"use server";

import { cookies } from "next/headers";
import { shortenAddress } from "thirdweb/utils";

import { getUser, isLoggedIn, requireAuth } from "~/app/actions/auth";

/**
 * Example: Public action (no auth required)
 */
export async function getPublicData() {
  return {
    message: "This is public data",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Example: Optional auth - works for both logged in and anonymous users
 */
export async function getPersonalizedGreeting() {
  const user = await getUser();

  if (user) {
    return {
      message: `Welcome back! Your wallet: ${shortenAddress(user.address)}`,
      isLoggedIn: true,
    };
  }

  return {
    message: "Welcome, guest! Sign in to see your dashboard.",
    isLoggedIn: false,
  };
}

/**
 * Example: Protected action - throws error if not logged in
 */
export async function getUserProfile() {
  const user = await requireAuth();

  return {
    address: user.address,
    shortAddress: `${shortenAddress(user.address)}`,
  };
}

/**
 * Example: Protected action with input
 */
export async function updateUserSettings(settings: {
  notifications: boolean;
  theme: "light" | "dark";
}) {
  const user = await requireAuth();

  // Here you would save to database
  // await db.update(users).set(settings).where(eq(users.address, user.address));

  return {
    success: true,
    address: user.address,
    settings,
  };
}

/**
 * Example: Protected action that could be used with tRPC or DB
 */
export async function createCourseCompletion(data: {
  courseId: string;
  score: number;
}) {
  const user = await requireAuth();

  // Example: Save to database
  // const completion = await db.insert(courseCompletions).values({
  //   userId: user.address,
  //   courseId: data.courseId,
  //   score: data.score,
  //   completedAt: new Date(),
  // }).returning();

  return {
    success: true,
    userAddress: user.address,
    courseId: data.courseId,
    score: data.score,
    completedAt: new Date().toISOString(),
  };
}

/**
 * Debug: Check current auth state
 */
export async function debugAuthState() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value;
  const loggedIn = await isLoggedIn();
  const user = await getUser();

  return {
    hasJwtCookie: !!jwt,
    jwtPreview: jwt ? `${jwt.slice(0, 20)}...${jwt.slice(-20)}` : null,
    isLoggedIn: loggedIn,
    user: user
      ? {
          address: user.address,
          shortAddress: shortenAddress(user.address),
        }
      : null,
    timestamp: new Date().toISOString(),
  };
}
