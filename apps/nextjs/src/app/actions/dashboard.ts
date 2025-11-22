"use server";

import { getContract, readContract } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";

import { db } from "@acme/db/client";
import { Course } from "@acme/db/schema";

import { requireAuth } from "~/app/actions/auth";
import { client } from "~/app/utils/thirdwebClient";
import { env } from "~/env";

// Contract ABI for the functions we need
const CONTRACT_ABI = [
  {
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "holder", type: "address" },
    ],
    name: "getExpiryTimestamp",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "holder", type: "address" },
    ],
    name: "getMintTimestamp",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "holder", type: "address" },
    ],
    name: "isValid",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

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

  const contractAddress = env.TRAINING_CERTIFICATION_ADDRESS;
  if (!contractAddress) {
    throw new Error("TRAINING_CERTIFICATION_ADDRESS is not configured");
  }

  // Get contract instance
  const contract = getContract({
    client,
    chain: baseSepolia,
    address: contractAddress as `0x${string}`,
    abi: CONTRACT_ABI,
  });

  // Get all courses from database
  const courses = await db.select().from(Course);

  // Check ownership for each course
  const userCourses: UserCourse[] = [];

  for (const course of courses) {
    // Check if user owns this certificate
    const balance = (await readContract({
      contract,
      method: "balanceOf",
      params: [user.walletAddress as `0x${string}`, BigInt(course.tokenId)],
    })) as bigint;

    if (balance > 0n) {
      // User owns this certificate, get additional details
      const [mintTimestamp, expiryTimestamp, isValidResult] = (await Promise.all([
        readContract({
          contract,
          method: "getMintTimestamp",
          params: [BigInt(course.tokenId), user.walletAddress as `0x${string}`],
        }),
        readContract({
          contract,
          method: "getExpiryTimestamp",
          params: [BigInt(course.tokenId), user.walletAddress as `0x${string}`],
        }),
        readContract({
          contract,
          method: "isValid",
          params: [BigInt(course.tokenId), user.walletAddress as `0x${string}`],
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
        isValid: isValidResult,
        validityMonths: course.validityMonths,
      });
    }
  }

  return userCourses;
}
