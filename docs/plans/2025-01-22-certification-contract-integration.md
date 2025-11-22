# Training Certification Contract Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate the TrainingCertification smart contract with the Next.js app, enabling admin operations to create courses and mint certifications using thirdweb v5 SDK.

**Architecture:** Server-side contract interactions using Next.js server actions with thirdweb v5 SDK. Admin wallet (private key) handles all write operations (create courses, mint certifications). Client-side components invoke server actions for contract operations.

**Tech Stack:** Next.js 16, thirdweb v5 SDK, TypeScript, Zod validation, Base Sepolia testnet

---

## Task 1: Update Environment Configuration

**Files:**
- Modify: `apps/nextjs/src/env.ts`
- Modify: `.env`

**Step 1: Add contract environment variables to env.ts**

Add to the `server` object in `apps/nextjs/src/env.ts`:

```typescript
server: {
  POSTGRES_URL: z.string().url(),
  THIRDWEB_SECRET_KEY: z.string().min(1),
  TRAINING_CERTIFICATION_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address"),
  PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Must be a valid private key with 0x prefix"),
},
```

**Step 2: Add variables to .env file**

Add to `.env`:

```bash
# Training Certification Contract (Base Sepolia)
TRAINING_CERTIFICATION_ADDRESS=
PRIVATE_KEY=0x...
```

**Step 3: Verify environment loading**

Run:
```bash
pnpm --filter @acme/nextjs typecheck
```

Expected: No type errors

**Step 4: Commit**

```bash
git add apps/nextjs/src/env.ts
git commit -m "feat(nextjs): add contract environment variables"
```

---

## Task 2: Create Contract Utility Module

**Files:**
- Create: `apps/nextjs/src/app/utils/contract.ts`

**Step 1: Create contract utility file**

Create `apps/nextjs/src/app/utils/contract.ts`:

```typescript
import { getContract } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";

import { client } from "~/app/utils/thirdwebClient";
import { ERC_1155_ABI } from "~/app/utils/constants/abi";
import { env } from "~/env";

/**
 * Get the TrainingCertification contract instance
 * This is a lightweight reference that can be reused throughout the app
 */
export function getTrainingCertificationContract() {
  const address = env.TRAINING_CERTIFICATION_ADDRESS;

  if (!address) {
    throw new Error("TRAINING_CERTIFICATION_ADDRESS environment variable is not set");
  }

  return getContract({
    client,
    chain: baseSepolia,
    address,
    abi: ERC_1155_ABI,
  });
}
```

**Step 2: Verify imports and types**

Run:
```bash
pnpm --filter @acme/nextjs typecheck
```

Expected: No type errors

**Step 3: Commit**

```bash
git add apps/nextjs/src/app/utils/contract.ts
git commit -m "feat(nextjs): add contract utility module"
```

---

## Task 3: Create Admin Account Utility

**Files:**
- Create: `apps/nextjs/src/app/utils/adminAccount.ts`

**Step 1: Create admin account utility**

Create `apps/nextjs/src/app/utils/adminAccount.ts`:

```typescript
import { privateKeyToAccount } from "thirdweb/wallets";
import { client } from "~/app/utils/thirdwebClient";
import { env } from "~/env";

/**
 * Get the admin account for contract operations
 * This account must have DEFAULT_ADMIN_ROLE and MINTER_ROLE on the contract
 *
 * @throws {Error} If PRIVATE_KEY is not configured
 */
export function getAdminAccount() {
  const privateKey = env.PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("PRIVATE_KEY environment variable is not set");
  }

  // Validate private key format
  if (!privateKey.startsWith("0x") || privateKey.length !== 66) {
    throw new Error("PRIVATE_KEY must be a 32-byte hex string with 0x prefix (66 characters total)");
  }

  return privateKeyToAccount({
    client,
    privateKey,
  });
}

/**
 * Get the admin account address without creating the full account
 * Useful for display purposes
 */
export function getAdminAddress(): string {
  const account = getAdminAccount();
  return account.address;
}
```

**Step 2: Test admin account initialization**

Run:
```bash
pnpm --filter @acme/nextjs typecheck
```

Expected: No type errors

**Step 3: Commit**

```bash
git add apps/nextjs/src/app/utils/adminAccount.ts
git commit -m "feat(nextjs): add admin account utility"
```

---

## Task 4: Create Server Actions for Course Management

**Files:**
- Create: `apps/nextjs/src/app/actions/certification.ts`

**Step 1: Create server actions file with type definitions**

Create `apps/nextjs/src/app/actions/certification.ts`:

```typescript
"use server";

import { prepareContractCall, sendAndConfirmTransaction, readContract } from "thirdweb";

import { getAdminAccount } from "~/app/utils/adminAccount";
import { getTrainingCertificationContract } from "~/app/utils/contract";

// ============================================================================
// Types
// ============================================================================

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface CourseData {
  courseCode: string;
  courseName: string;
  imageURI: string;
  validityDurationInSeconds: bigint;
}

export interface CourseDetails {
  courseCode: string;
  courseName: string;
  imageURI: string;
  validityDuration: bigint;
  exists: boolean;
}

// ============================================================================
// Read Functions
// ============================================================================

/**
 * Get total number of courses created
 */
export async function getTotalCourses(): Promise<ActionResult<bigint>> {
  try {
    const contract = getTrainingCertificationContract();

    const total = await readContract({
      contract,
      method: "function getTotalCourses() view returns (uint256)",
      params: [],
    });

    return { success: true, data: total };
  } catch (error) {
    console.error("Error getting total courses:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get total courses",
    };
  }
}

/**
 * Get course details by token ID
 */
export async function getCourseDetails(
  tokenId: bigint
): Promise<ActionResult<CourseDetails>> {
  try {
    const contract = getTrainingCertificationContract();

    const course = await readContract({
      contract,
      method: "function getCourse(uint256) view returns (tuple(string courseCode, string courseName, string imageURI, uint256 validityDuration, bool exists))",
      params: [tokenId],
    });

    return {
      success: true,
      data: {
        courseCode: course[0],
        courseName: course[1],
        imageURI: course[2],
        validityDuration: course[3],
        exists: course[4],
      },
    };
  } catch (error) {
    console.error("Error getting course details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get course details",
    };
  }
}

/**
 * Check if a user has a valid certification
 */
export async function isValidCertification(
  tokenId: bigint,
  holderAddress: string
): Promise<ActionResult<boolean>> {
  try {
    const contract = getTrainingCertificationContract();

    const isValid = await readContract({
      contract,
      method: "function isValid(uint256 tokenId, address holder) view returns (bool)",
      params: [tokenId, holderAddress],
    });

    return { success: true, data: isValid };
  } catch (error) {
    console.error("Error checking certification validity:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to check validity",
    };
  }
}

// ============================================================================
// Write Functions (Admin Only)
// ============================================================================

/**
 * Create a new course (ERC-1155 token)
 * Requires DEFAULT_ADMIN_ROLE
 */
export async function createCourse(
  data: CourseData
): Promise<ActionResult<{ transactionHash: string }>> {
  try {
    const contract = getTrainingCertificationContract();
    const adminAccount = getAdminAccount();

    // Prepare the transaction
    const transaction = prepareContractCall({
      contract,
      method: "function createCourse(string courseCode, string courseName, string imageURI, uint256 validityDuration) returns (uint256)",
      params: [
        data.courseCode,
        data.courseName,
        data.imageURI,
        data.validityDurationInSeconds,
      ],
    });

    // Send and wait for confirmation
    const receipt = await sendAndConfirmTransaction({
      transaction,
      account: adminAccount,
    });

    console.log("Course created successfully:", receipt.transactionHash);

    return {
      success: true,
      data: {
        transactionHash: receipt.transactionHash,
      },
    };
  } catch (error) {
    console.error("Error creating course:", error);

    // Handle specific error cases
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes("accesscontrolunauthorizedaccount")) {
        return {
          success: false,
          error: "Account does not have DEFAULT_ADMIN_ROLE",
        };
      }
      if (errorMessage.includes("course code already exists")) {
        return {
          success: false,
          error: "Course code already exists",
        };
      }
      if (errorMessage.includes("gas")) {
        return {
          success: false,
          error: "Gas estimation failed - check parameters",
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create course",
    };
  }
}

/**
 * Update an existing course
 * Requires DEFAULT_ADMIN_ROLE
 */
export async function updateCourse(data: {
  tokenId: bigint;
  courseName: string;
  imageURI: string;
  validityDurationInSeconds: bigint;
}): Promise<ActionResult<{ transactionHash: string }>> {
  try {
    const contract = getTrainingCertificationContract();
    const adminAccount = getAdminAccount();

    const transaction = prepareContractCall({
      contract,
      method: "function updateCourse(uint256 tokenId, string courseName, string imageURI, uint256 validityDuration)",
      params: [
        data.tokenId,
        data.courseName,
        data.imageURI,
        data.validityDurationInSeconds,
      ],
    });

    const receipt = await sendAndConfirmTransaction({
      transaction,
      account: adminAccount,
    });

    return {
      success: true,
      data: {
        transactionHash: receipt.transactionHash,
      },
    };
  } catch (error) {
    console.error("Error updating course:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update course",
    };
  }
}
```

**Step 2: Verify types and imports**

Run:
```bash
pnpm --filter @acme/nextjs typecheck
```

Expected: No type errors

**Step 3: Commit**

```bash
git add apps/nextjs/src/app/actions/certification.ts
git commit -m "feat(nextjs): add course management server actions"
```

---

## Task 5: Create Server Actions for Certification Minting

**Files:**
- Modify: `apps/nextjs/src/app/actions/certification.ts`

**Step 1: Add minting server actions**

Add to `apps/nextjs/src/app/actions/certification.ts`:

```typescript
/**
 * Mint a certification to a single user
 * Requires MINTER_ROLE
 */
export async function mintCertification(data: {
  recipientAddress: string;
  tokenId: bigint;
}): Promise<ActionResult<{ transactionHash: string }>> {
  try {
    const contract = getTrainingCertificationContract();
    const adminAccount = getAdminAccount();

    const transaction = prepareContractCall({
      contract,
      method: "function mintCertification(address to, uint256 tokenId, bytes data)",
      params: [
        data.recipientAddress,
        data.tokenId,
        "0x", // Empty bytes data
      ],
    });

    const receipt = await sendAndConfirmTransaction({
      transaction,
      account: adminAccount,
    });

    console.log("Certification minted:", receipt.transactionHash);

    return {
      success: true,
      data: {
        transactionHash: receipt.transactionHash,
      },
    };
  } catch (error) {
    console.error("Error minting certification:", error);

    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes("accesscontrolunauthorizedaccount")) {
        return {
          success: false,
          error: "Account does not have MINTER_ROLE",
        };
      }
      if (errorMessage.includes("erc1155invalidreceiver")) {
        return {
          success: false,
          error: "Invalid recipient address",
        };
      }
      if (errorMessage.includes("course does not exist")) {
        return {
          success: false,
          error: "Course token ID does not exist",
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mint certification",
    };
  }
}

/**
 * Mint certifications to multiple users at once
 * Requires MINTER_ROLE
 */
export async function batchMintCertifications(data: {
  recipientAddresses: string[];
  tokenId: bigint;
}): Promise<ActionResult<{ transactionHash: string; count: number }>> {
  try {
    const contract = getTrainingCertificationContract();
    const adminAccount = getAdminAccount();

    // Validate recipients
    if (data.recipientAddresses.length === 0) {
      return {
        success: false,
        error: "Recipients array cannot be empty",
      };
    }

    if (data.recipientAddresses.length > 100) {
      return {
        success: false,
        error: "Cannot mint to more than 100 recipients at once",
      };
    }

    const transaction = prepareContractCall({
      contract,
      method: "function batchMintCertifications(address[] recipients, uint256 tokenId, bytes data)",
      params: [
        data.recipientAddresses,
        data.tokenId,
        "0x", // Empty bytes data
      ],
    });

    const receipt = await sendAndConfirmTransaction({
      transaction,
      account: adminAccount,
    });

    console.log(
      `Batch minted ${data.recipientAddresses.length} certifications:`,
      receipt.transactionHash
    );

    return {
      success: true,
      data: {
        transactionHash: receipt.transactionHash,
        count: data.recipientAddresses.length,
      },
    };
  } catch (error) {
    console.error("Error batch minting certifications:", error);

    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes("accesscontrolunauthorizedaccount")) {
        return {
          success: false,
          error: "Account does not have MINTER_ROLE",
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to batch mint certifications",
    };
  }
}

/**
 * Get user's certification balance
 */
export async function getCertificationBalance(
  holderAddress: string,
  tokenId: bigint
): Promise<ActionResult<bigint>> {
  try {
    const contract = getTrainingCertificationContract();

    const balance = await readContract({
      contract,
      method: "function balanceOf(address account, uint256 id) view returns (uint256)",
      params: [holderAddress, tokenId],
    });

    return { success: true, data: balance };
  } catch (error) {
    console.error("Error getting certification balance:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get balance",
    };
  }
}

/**
 * Get certification expiry timestamp
 */
export async function getExpiryTimestamp(
  tokenId: bigint,
  holderAddress: string
): Promise<ActionResult<bigint>> {
  try {
    const contract = getTrainingCertificationContract();

    const expiry = await readContract({
      contract,
      method: "function getExpiryTimestamp(uint256 tokenId, address holder) view returns (uint256)",
      params: [tokenId, holderAddress],
    });

    return { success: true, data: expiry };
  } catch (error) {
    console.error("Error getting expiry timestamp:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get expiry",
    };
  }
}
```

**Step 2: Verify types and imports**

Run:
```bash
pnpm --filter @acme/nextjs typecheck
```

Expected: No type errors

**Step 3: Commit**

```bash
git add apps/nextjs/src/app/actions/certification.ts
git commit -m "feat(nextjs): add certification minting server actions"
```

---

## Task 6: Add Input Validation with Zod

**Files:**
- Create: `apps/nextjs/src/app/validators/certification.ts`
- Modify: `apps/nextjs/src/app/actions/certification.ts`

**Step 1: Create validation schemas**

Create `apps/nextjs/src/app/validators/certification.ts`:

```typescript
import { z } from "zod";

/**
 * Ethereum address validation
 */
export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address");

/**
 * URL validation for image URIs
 */
export const imageURISchema = z
  .string()
  .url("Must be a valid URL")
  .min(1, "Image URI cannot be empty");

/**
 * Course code validation (alphanumeric with hyphens)
 */
export const courseCodeSchema = z
  .string()
  .min(1, "Course code cannot be empty")
  .max(50, "Course code must be 50 characters or less")
  .regex(/^[A-Z0-9-]+$/, "Course code must be uppercase alphanumeric with hyphens");

/**
 * Course name validation
 */
export const courseNameSchema = z
  .string()
  .min(1, "Course name cannot be empty")
  .max(200, "Course name must be 200 characters or less");

/**
 * Validity duration in days (will be converted to seconds)
 */
export const validityDurationDaysSchema = z
  .number()
  .int()
  .min(1, "Validity must be at least 1 day")
  .max(3650, "Validity cannot exceed 10 years");

/**
 * Create course validation schema
 */
export const createCourseSchema = z.object({
  courseCode: courseCodeSchema,
  courseName: courseNameSchema,
  imageURI: imageURISchema,
  validityDurationDays: validityDurationDaysSchema,
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;

/**
 * Mint certification validation schema
 */
export const mintCertificationSchema = z.object({
  recipientAddress: ethereumAddressSchema,
  tokenId: z.bigint().nonnegative("Token ID must be non-negative"),
});

export type MintCertificationInput = z.infer<typeof mintCertificationSchema>;

/**
 * Batch mint certification validation schema
 */
export const batchMintCertificationSchema = z.object({
  recipientAddresses: z
    .array(ethereumAddressSchema)
    .min(1, "Must provide at least one recipient")
    .max(100, "Cannot mint to more than 100 recipients at once"),
  tokenId: z.bigint().nonnegative("Token ID must be non-negative"),
});

export type BatchMintCertificationInput = z.infer<typeof batchMintCertificationSchema>;
```

**Step 2: Add validation to server actions**

Update the server actions in `apps/nextjs/src/app/actions/certification.ts` to use validation:

```typescript
import {
  createCourseSchema,
  mintCertificationSchema,
  batchMintCertificationSchema,
  type CreateCourseInput,
  type MintCertificationInput,
  type BatchMintCertificationInput,
} from "~/app/validators/certification";

/**
 * Create a new course with input validation
 */
export async function createCourseWithValidation(
  input: CreateCourseInput
): Promise<ActionResult<{ transactionHash: string }>> {
  // Validate input
  const validationResult = createCourseSchema.safeParse(input);

  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.errors[0]?.message ?? "Invalid input",
    };
  }

  const { courseCode, courseName, imageURI, validityDurationDays } = validationResult.data;

  // Convert days to seconds
  const validityDurationInSeconds = BigInt(validityDurationDays * 86400);

  return createCourse({
    courseCode,
    courseName,
    imageURI,
    validityDurationInSeconds,
  });
}

/**
 * Mint certification with input validation
 */
export async function mintCertificationWithValidation(
  input: MintCertificationInput
): Promise<ActionResult<{ transactionHash: string }>> {
  const validationResult = mintCertificationSchema.safeParse(input);

  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.errors[0]?.message ?? "Invalid input",
    };
  }

  return mintCertification(validationResult.data);
}

/**
 * Batch mint certifications with input validation
 */
export async function batchMintCertificationsWithValidation(
  input: BatchMintCertificationInput
): Promise<ActionResult<{ transactionHash: string; count: number }>> {
  const validationResult = batchMintCertificationSchema.safeParse(input);

  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.errors[0]?.message ?? "Invalid input",
    };
  }

  return batchMintCertifications(validationResult.data);
}
```

**Step 3: Verify types and validation**

Run:
```bash
pnpm --filter @acme/nextjs typecheck
```

Expected: No type errors

**Step 4: Commit**

```bash
git add apps/nextjs/src/app/validators/certification.ts apps/nextjs/src/app/actions/certification.ts
git commit -m "feat(nextjs): add input validation for certification actions"
```

---

## Task 7: Create Test Page for Contract Integration

**Files:**
- Create: `apps/nextjs/src/app/admin/certification/page.tsx`

**Step 1: Create admin certification page**

Create `apps/nextjs/src/app/admin/certification/page.tsx`:

```typescript
import { getTotalCourses } from "~/app/actions/certification";
import { CreateCourseForm } from "./_components/create-course-form";
import { MintCertificationForm } from "./_components/mint-certification-form";

export default async function CertificationAdminPage() {
  const totalCoursesResult = await getTotalCourses();
  const totalCourses = totalCoursesResult.success ? totalCoursesResult.data : 0n;

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <h1 className="mb-8 text-3xl font-bold">Certification Administration</h1>

      <div className="mb-8 rounded-lg border p-4">
        <p className="text-lg">
          Total Courses: <span className="font-semibold">{totalCourses.toString()}</span>
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="mb-4 text-2xl font-semibold">Create New Course</h2>
          <CreateCourseForm />
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Mint Certification</h2>
          <MintCertificationForm />
        </section>
      </div>
    </div>
  );
}
```

**Step 2: Create form components directory**

Run:
```bash
mkdir -p apps/nextjs/src/app/admin/certification/_components
```

Expected: Directory created

**Step 3: Verify page renders**

Run:
```bash
pnpm --filter @acme/nextjs typecheck
```

Expected: Type errors about missing form components (we'll create them next)

**Step 4: Commit**

```bash
git add apps/nextjs/src/app/admin/certification/page.tsx
git commit -m "feat(nextjs): add certification admin page structure"
```

---

## Task 8: Create Course Creation Form Component

**Files:**
- Create: `apps/nextjs/src/app/admin/certification/_components/create-course-form.tsx`

**Step 1: Create form component**

Create `apps/nextjs/src/app/admin/certification/_components/create-course-form.tsx`:

```typescript
"use client";

import { useState } from "react";
import { createCourseWithValidation } from "~/app/actions/certification";

export function CreateCourseForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await createCourseWithValidation({
        courseCode: formData.get("courseCode") as string,
        courseName: formData.get("courseName") as string,
        imageURI: formData.get("imageURI") as string,
        validityDurationDays: parseInt(formData.get("validityDays") as string),
      });

      if (response.success) {
        setResult({
          success: true,
          message: `Course created! TX: ${response.data.transactionHash}`,
        });
        // Reset form
        e.currentTarget.reset();
      } else {
        setResult({
          success: false,
          message: response.error,
        });
      }
    } catch (error) {
      console.error(error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to create course",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="courseCode" className="block text-sm font-medium">
            Course Code *
          </label>
          <input
            id="courseCode"
            name="courseCode"
            type="text"
            placeholder="REACT-101"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
          <p className="mt-1 text-sm text-gray-500">
            Uppercase alphanumeric with hyphens (e.g., REACT-101)
          </p>
        </div>

        <div>
          <label htmlFor="courseName" className="block text-sm font-medium">
            Course Name *
          </label>
          <input
            id="courseName"
            name="courseName"
            type="text"
            placeholder="React Developer Certification"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="imageURI" className="block text-sm font-medium">
            Image URI *
          </label>
          <input
            id="imageURI"
            name="imageURI"
            type="url"
            placeholder="https://example.com/badges/react-101.png"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="validityDays" className="block text-sm font-medium">
            Validity Duration (days) *
          </label>
          <input
            id="validityDays"
            name="validityDays"
            type="number"
            placeholder="365"
            min="1"
            max="3650"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
          <p className="mt-1 text-sm text-gray-500">
            How long certifications are valid (1-3650 days)
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating Course..." : "Create Course"}
        </button>
      </form>

      {result && (
        <div
          className={`mt-4 rounded-md p-4 ${
            result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          <p className="text-sm font-medium">{result.message}</p>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify component types**

Run:
```bash
pnpm --filter @acme/nextjs typecheck
```

Expected: No type errors

**Step 3: Commit**

```bash
git add apps/nextjs/src/app/admin/certification/_components/create-course-form.tsx
git commit -m "feat(nextjs): add create course form component"
```

---

## Task 9: Create Mint Certification Form Component

**Files:**
- Create: `apps/nextjs/src/app/admin/certification/_components/mint-certification-form.tsx`

**Step 1: Create minting form component**

Create `apps/nextjs/src/app/admin/certification/_components/mint-certification-form.tsx`:

```typescript
"use client";

import { useState } from "react";
import { mintCertificationWithValidation } from "~/app/actions/certification";

export function MintCertificationForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await mintCertificationWithValidation({
        recipientAddress: formData.get("recipientAddress") as string,
        tokenId: BigInt(formData.get("tokenId") as string),
      });

      if (response.success) {
        setResult({
          success: true,
          message: `Certification minted! TX: ${response.data.transactionHash}`,
        });
        // Reset form
        e.currentTarget.reset();
      } else {
        setResult({
          success: false,
          message: response.error,
        });
      }
    } catch (error) {
      console.error(error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to mint certification",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="recipientAddress" className="block text-sm font-medium">
            Recipient Address *
          </label>
          <input
            id="recipientAddress"
            name="recipientAddress"
            type="text"
            placeholder="0x..."
            required
            pattern="^0x[a-fA-F0-9]{40}$"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
          />
          <p className="mt-1 text-sm text-gray-500">
            Ethereum address of the certification recipient
          </p>
        </div>

        <div>
          <label htmlFor="tokenId" className="block text-sm font-medium">
            Token ID (Course) *
          </label>
          <input
            id="tokenId"
            name="tokenId"
            type="number"
            placeholder="1"
            min="1"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
          <p className="mt-1 text-sm text-gray-500">
            Token ID of the course to certify
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Minting Certification..." : "Mint Certification"}
        </button>
      </form>

      {result && (
        <div
          className={`mt-4 rounded-md p-4 ${
            result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          <p className="text-sm font-medium">{result.message}</p>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify component types**

Run:
```bash
pnpm --filter @acme/nextjs typecheck
```

Expected: No type errors

**Step 3: Test the page loads**

Run:
```bash
pnpm --filter @acme/nextjs dev
```

Then visit: `http://localhost:3000/admin/certification`

Expected: Page loads with both forms visible

**Step 4: Commit**

```bash
git add apps/nextjs/src/app/admin/certification/_components/mint-certification-form.tsx
git commit -m "feat(nextjs): add mint certification form component"
```

---

## Task 10: Final Integration Testing

**Files:**
- N/A (testing only)

**Step 1: Set contract address in .env**

Ensure `.env` has the deployed contract address:

```bash
TRAINING_CERTIFICATION_ADDRESS=<your_deployed_address>
```

**Step 2: Test course creation**

1. Start dev server: `pnpm --filter @acme/nextjs dev`
2. Navigate to `/admin/certification`
3. Fill out "Create Course" form with test data:
   - Course Code: TEST-101
   - Course Name: Test Certification
   - Image URI: https://placehold.co/400x400/png
   - Validity Days: 365
4. Submit form
5. Verify success message with transaction hash

Expected: Course created successfully, transaction hash displayed

**Step 3: Test certification minting**

1. Use recipient address from a test wallet
2. Use token ID 1 (from course created in step 2)
3. Submit "Mint Certification" form
4. Verify success message

Expected: Certification minted successfully

**Step 4: Verify on Base Sepolia explorer**

Visit: `https://sepolia.basescan.org/address/<CONTRACT_ADDRESS>`

Expected: See your transactions (createCourse, mintCertification)

**Step 5: Final commit**

```bash
git add .
git commit -m "feat(nextjs): complete certification contract integration

- Add contract utility modules
- Add admin account management
- Add server actions for course and certification management
- Add input validation with Zod
- Add admin UI with forms for testing
- Integrate with TrainingCertification contract on Base Sepolia

All features tested and working"
```

---

## Post-Implementation Tasks

**Required:**
1. Add TRAINING_CERTIFICATION_ADDRESS to `.env` after deployment
2. Ensure PRIVATE_KEY has proper 0x prefix
3. Test all operations on Base Sepolia testnet

**Optional Enhancements:**
1. Add batch minting UI for multiple recipients
2. Add course listing/management page
3. Add transaction status monitoring with polling
4. Add role management UI for granting MINTER_ROLE to other addresses
5. Add certification verification public page
6. Add event listeners for contract events
7. Add error boundary components for better error handling
8. Add loading skeletons for better UX

---

## Environment Variables Checklist

Ensure these are set in `.env`:

```bash
✅ NEXT_PUBLIC_THIRDWEB_CLIENT_ID=...
✅ THIRDWEB_SECRET_KEY=...
✅ TRAINING_CERTIFICATION_ADDRESS=0x...
✅ PRIVATE_KEY=0x...
✅ BASE_SEPOLIA_RPC_URL=...
✅ POSTGRES_URL=...
```

---

## Success Criteria

✅ Contract utility modules created and type-safe
✅ Admin account properly configured with private key
✅ Server actions for course creation functional
✅ Server actions for certification minting functional
✅ Input validation working with Zod schemas
✅ Admin UI forms rendering and functional
✅ Course creation transaction succeeds on Base Sepolia
✅ Certification minting transaction succeeds on Base Sepolia
✅ All TypeScript checks passing
✅ No runtime errors in development

## Security Notes

⚠️ **CRITICAL:** Never expose PRIVATE_KEY client-side
⚠️ **CRITICAL:** Always use server actions for write operations
⚠️ **IMPORTANT:** Validate all inputs before sending transactions
⚠️ **IMPORTANT:** Check admin roles before privileged operations
⚠️ **RECOMMENDED:** Add rate limiting to server actions in production
⚠️ **RECOMMENDED:** Add admin authentication middleware
