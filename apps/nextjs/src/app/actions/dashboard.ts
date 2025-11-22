"use server";

import { readContract } from "thirdweb";

import { db } from "@acme/db/client";
import { Course } from "@acme/db/schema";

import { requireAuth } from "~/app/actions/auth";
import { getTrainingCertificationContract } from "~/app/utils/contract";

export interface UserCourse {
  id: string;
  name: string;
  description: string;
  courseCode: string;
  imageUrl: string;
  tokenId: number;
  mintTimestamp: number;
  expiryTimestamp: number;
  isValid: boolean;
  validityMonths: number;
}

/**
 * Get all courses owned by the authenticated user
 * Queries the blockchain to check certificate ownership
 */
export async function getUserCourses(): Promise<UserCourse[]> {
  const user = await requireAuth();

  // Get contract instance
  const contract = getTrainingCertificationContract();

  // Get all courses from database
  const courses = await db.select().from(Course);

  // Check ownership for each course
  const userCourses: UserCourse[] = [];

  for (const course of courses) {
    // Check if user owns this certificate
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const balance = (await readContract({
      contract,
      method: "balanceOf",
      params: [user.walletAddress as `0x${string}`, BigInt(course.tokenId)],
    })) as bigint;

    if (balance > 0n) {
      // User owns this certificate, get additional details

      const [mintTimestamp, expiryTimestamp, isValidResult] =
        (await Promise.all([
          readContract({
            contract,
            method: "getMintTimestamp",
            params: [
              BigInt(course.tokenId),
              user.walletAddress as `0x${string}`,
            ],
          }),
          readContract({
            contract,
            method: "getExpiryTimestamp",
            params: [
              BigInt(course.tokenId),
              user.walletAddress as `0x${string}`,
            ],
          }),
          readContract({
            contract,
            method: "isValid",
            params: [
              BigInt(course.tokenId),
              user.walletAddress as `0x${string}`,
            ],
          }),
        ])) as [bigint, bigint, boolean];

      userCourses.push({
        id: course.id,
        name: course.name,
        description: course.description,
        courseCode: course.courseCode,
        imageUrl: course.imageUrl,
        tokenId: course.tokenId,
        mintTimestamp: Number(mintTimestamp),
        expiryTimestamp: Number(expiryTimestamp),
        isValid: !isValidResult,
        validityMonths: course.validityMonths ?? 12,
      });
    }
  }

  return userCourses;
}
