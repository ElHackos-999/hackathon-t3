# Course Completion NFT Platform – 12-Hour Hackathon MVP Plan

**Stack:** Next.js 15 • React 19 • Tailwind 4 • shadcn/ui • Drizzle ORM • Better Auth • tRPC v11 • Thirdweb SDK v5 • Turborepo

**Team:** 3 developers • 12 hours • T3 Turbo monorepo

---

## Table of Contents

1. [User Stories](#user-stories)
2. [Data Model](#data-model)
3. [System Architecture](#system-architecture)
4. [tRPC API Routers](#trpc-api-routers)
5. [UI Components & Routes](#ui-components--routes)
6. [Smart Contract Setup](#smart-contract-setup)
7. [Hour-by-Hour Timeline](#hour-by-hour-timeline)
8. [Implementation Checklists](#implementation-checklists)
9. [Demo Script](#demo-script)
10. [Deployment & Environment](#deployment--environment)

---

## User Stories

### Story 1: Admin – Manage Courses & Mint NFTs

- As an **admin**, I can log in via Better Auth so my minting actions are authenticated and auditable.
- As an **admin**, I can create/edit courses (code, name, description, image, default expiry days) so NFT metadata is centralized in the database.
- As an **admin**, I can select a course and user (by email) and mint an ERC-1155 NFT so the user receives on-chain proof of completion.
- As an **admin**, I can view a list of previously minted completions so I can track which users hold which certificates.

**Acceptance Criteria:**

- Only users with `role: "admin"` in Better Auth can access `/admin`.
- Create/edit course forms persist to `courses` table via tRPC.
- Minting flow: select user → select course → call `nft.mintCompletion` → on-chain mint + DB record created.
- Mint history shows user email, course name, completion date, tx hash (viewable on block explorer).

---

### Story 2: Authenticated User – View Completions & Share Proofs

- As an **authenticated user**, I can log in via Better Auth (linked to my wallet) so my profile ties to on-chain NFTs.
- As an **authenticated user**, I can view my completed courses so I know which certificates I hold.
- As an **authenticated user**, I can generate a proof for any completion so I can share verifiable proof with others.
- As an **authenticated user**, I can manage my proofs (list, copy link, revoke) so I control which verifications remain valid.

**Acceptance Criteria:**

- Login redirects to `/dashboard/courses` (or login page if not authenticated).
- Dashboard shows all `courseCompletions` where `userId = current user`.
- Each completion card has "Generate proof" button → creates row in `proofs` table.
- Proof links (e.g., `/proof/{proofHash}`) are copyable and shareable.
- "My proofs" page lists all proofs and allows revocation (set `isRevoked = true`).

---

### Story 3: Anyone – Browse Courses & Verify Proofs

- As **any visitor**, I can view all courses (from `/courses`) with metadata so I know what certificates exist.
- As **any visitor**, I can open a course detail page (`/courses/[courseCode]`) to see on-chain details (contract address, tokenId).
- As **any visitor**, I can open a shared proof link (`/proof/[hash]`) and verify its validity so I can trust claims of completion.

**Acceptance Criteria:**

- `/courses` is public and lists all courses without authentication.
- `/courses/[courseCode]` shows metadata, image, and on-chain contract/tokenId info.
- `/proof/[hash]` is public; shows "Verified ✓" if proof is valid (not revoked, not expired), includes course name + user pseudonym + date.
- Invalid/expired/revoked proofs show clear error message.

---

## Data Model

### Drizzle ORM Schema (`packages/db/src/schema/courses.ts`)

```ts
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema"; // from Better Auth

// Courses table – metadata for each NFT type
export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseCode: text("course_code").notNull().unique(),
    courseName: text("course_name").notNull(),
    description: text("description"),
    imageUri: text("image_uri").notNull(), // IPFS or HTTPS URL for NFT image
    defaultExpiryDays: integer("default_expiry_days").default(0).notNull(), // 0 = no expiry
    tokenId: integer("token_id").notNull().unique(), // ERC-1155 tokenId on contract
    contractAddress: text("contract_address").notNull(), // ERC-1155 contract address
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    codeIdx: index("courses_code_idx").on(table.courseCode),
  }),
);

// Course completions – tracks which users have which NFTs
export const courseCompletions = pgTable(
  "course_completions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    walletAddress: text("wallet_address").notNull(), // user's wallet that holds the NFT
    tokenId: integer("token_id").notNull(), // redundant for query speed
    completionDate: timestamp("completion_date").defaultNow().notNull(),
    expiryDate: timestamp("expiry_date"), // null = no expiry
    txHash: text("tx_hash").notNull(), // on-chain transaction hash
  },
  (table) => ({
    userCourseIdx: index("user_course_idx").on(table.userId, table.courseId),
    walletIdx: index("wallet_idx").on(table.walletAddress),
  }),
);

// Proofs – user-generated proof tokens for sharing
export const proofs = pgTable(
  "proofs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    proofHash: text("proof_hash").notNull().unique(), // unique proof identifier
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id),
    tokenId: integer("token_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at"), // optional: proof validity window
    isRevoked: boolean("is_revoked").default(false).notNull(),
  },
  (table) => ({
    proofIdx: index("proof_hash_idx").on(table.proofHash),
  }),
);

// Relations for convenient queries
export const coursesRelations = relations(courses, ({ many }) => ({
  completions: many(courseCompletions),
}));

export const courseCompletionsRelations = relations(
  courseCompletions,
  ({ one }) => ({
    course: one(courses, {
      fields: [courseCompletions.courseId],
      references: [courses.id],
    }),
    user: one(user, {
      fields: [courseCompletions.userId],
      references: [user.id],
    }),
  }),
);

export const proofsRelations = relations(proofs, ({ one }) => ({
  course: one(courses, {
    fields: [proofs.courseId],
    references: [courses.id],
  }),
  user: one(user, {
    fields: [proofs.userId],
    references: [user.id],
  }),
}));
```

**Update barrel export:**

```ts
// packages/db/src/schema/index.ts
export * from "./auth-schema";
export * from "./courses";
```

**Apply migration:**

```bash
pnpm db:push
```

---

## System Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    T3 Turbo Monorepo                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  apps/nextjs (Next.js 15)                                        │
│  ├─ /admin → AdminMintCertificateCard → tRPC nft.mintCompletion │
│  ├─ /dashboard → CompletedCoursesGrid → tRPC proof.generateProof│
│  ├─ /courses → PublicCourseList → tRPC course.listCourses       │
│  └─ /proof/[hash] → ProofVerificationCard → tRPC proof.verify   │
│                                                                   │
│  packages/api (tRPC v11 routers)                                 │
│  ├─ courseRouter                                                 │
│  │  ├─ listCourses (public)                                      │
│  │  ├─ getCourseByCode (public)                                  │
│  │  ├─ createCourse (admin)                                      │
│  │  └─ updateCourse (admin)                                      │
│  ├─ nftRouter                                                    │
│  │  ├─ mintCompletion (admin, calls thirdweb SDK)                │
│  │  ├─ getMyCompletions (protected)                              │
│  │  └─ getAllUsers (admin)                                       │
│  └─ proofRouter                                                  │
│     ├─ generateProof (protected)                                 │
│     ├─ verifyProof (public)                                      │
│     ├─ listMyProofs (protected)                                  │
│     └─ revokeProof (protected)                                   │
│                                                                   │
│  packages/db (Drizzle ORM)                                       │
│  └─ schema: courses, courseCompletions, proofs                   │
│                                                                   │
│  packages/auth (Better Auth)                                     │
│  └─ user, account, session tables (auto-generated)               │
│                                                                   │
│  packages/ui (shadcn components)                                 │
│  ├─ CourseFormCard, CourseListTable                              │
│  ├─ AdminMintCertificateCard                                     │
│  ├─ CompletedCourseCard, CompletedCoursesGrid                    │
│  ├─ MyProofsTable                                                │
│  └─ ProofVerificationCard, PublicCourseCard                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
        ↓                          ↓
   ┌─────────────────┐    ┌──────────────────┐
   │ Thirdweb SDK v5 │    │  Drizzle + PG    │
   │  ERC-1155       │    │  (Supabase)      │
   │  Minting        │    │  Persistent DB   │
   └─────────────────┘    └──────────────────┘
        ↓
   ┌─────────────────┐
   │  Blockchain     │
   │  (Mumbai/etc)   │
   └─────────────────┘
```

### Key Integration Points

1. **Better Auth** (packages/auth)
   - Already configured for user login/register.
   - Provides `session.user.id` and `session.user.email` in tRPC context.
   - Admin role determined by custom field (see deployment section).

2. **Drizzle ORM** (packages/db)
   - Queries via tRPC procedures.
   - All course/completion/proof data persisted.

3. **tRPC** (packages/api)
   - Type-safe bridge between frontend and DB.
   - Context includes `db` (Drizzle client) and `session` (Better Auth).

4. **Thirdweb SDK** (client-side in tRPC backend)
   - Used in `nftRouter.mintCompletion` to call ERC-1155 contract.
   - Requires `THIRDWEB_SECRET_KEY` and `NEXT_PUBLIC_CONTRACT_ADDRESS`.

5. **shadcn/ui** (packages/ui)
   - Pre-built components; extend with custom feature components.

---

## tRPC API Routers

### courseRouter

Located in `packages/api/src/router/course.ts`:

```ts
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { courseCompletions, courses } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const courseRouter = createTRPCRouter({
  // Public: List all courses
  listCourses: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.courses.findMany({
      orderBy: desc(courses.createdAt),
    });
  }),

  // Public: Get course by code
  getCourseByCode: publicProcedure
    .input(z.object({ courseCode: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.courses.findFirst({
        where: eq(courses.courseCode, input.courseCode),
      });
    }),

  // Admin: Create course
  createCourse: protectedProcedure
    .input(
      z.object({
        courseCode: z.string().min(1),
        courseName: z.string().min(1),
        description: z.string().optional(),
        imageUri: z.string().url(),
        defaultExpiryDays: z.number().int().min(0).default(0),
        tokenId: z.number().int().positive(),
        contractAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Check if admin; throw if not
      const [course] = await ctx.db.insert(courses).values(input).returning();
      return course;
    }),

  // Admin: Update course
  updateCourse: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        courseName: z.string().optional(),
        description: z.string().optional(),
        imageUri: z.string().url().optional(),
        defaultExpiryDays: z.number().int().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      // TODO: Check if admin
      const [course] = await ctx.db
        .update(courses)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(courses.id, id))
        .returning();
      return course;
    }),
});
```

### nftRouter

Located in `packages/api/src/router/nft.ts`:

```ts
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { courseCompletions, courses } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

const sdk = new ThirdwebSDK("mumbai", {
  secretKey: process.env.THIRDWEB_SECRET_KEY,
});

export const nftRouter = createTRPCRouter({
  // Admin: Mint completion to user
  mintCompletion: protectedProcedure
    .input(
      z.object({
        userEmail: z.string().email(),
        courseCode: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Check if admin

      // 1. Find user by email
      const targetUser = await ctx.db.query.user.findFirst({
        where: (users, { eq }) => eq(users.email, input.userEmail),
        with: { accounts: true }, // get wallet accounts
      });
      if (!targetUser) throw new Error("User not found");

      // 2. Find course by code
      const course = await ctx.db.query.courses.findFirst({
        where: eq(courses.courseCode, input.courseCode),
      });
      if (!course) throw new Error("Course not found");

      // 3. Check if already completed
      const existing = await ctx.db.query.courseCompletions.findFirst({
        where: and(
          eq(courseCompletions.userId, targetUser.id),
          eq(courseCompletions.courseId, course.id),
        ),
      });
      if (existing) throw new Error("User already completed this course");

      // 4. Get wallet address from user's accounts (Better Auth)
      const walletAccount = targetUser.accounts?.[0];
      if (!walletAccount) throw new Error("User has no wallet connected");
      const walletAddress = walletAccount.providerAccountId; // depends on account type

      // 5. Mint via thirdweb SDK
      const contract = await sdk.getContract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
      );
      const tx = await contract.call("mintCompletion", [
        walletAddress,
        course.courseName,
        course.imageUri, // metadata URI or token URI
      ]);

      // 6. Calculate expiry
      const completionDate = new Date();
      const expiryDate =
        course.defaultExpiryDays > 0
          ? new Date(
              completionDate.getTime() +
                course.defaultExpiryDays * 24 * 60 * 60 * 1000,
            )
          : null;

      // 7. Save completion record
      const [completion] = await ctx.db
        .insert(courseCompletions)
        .values({
          userId: targetUser.id,
          courseId: course.id,
          walletAddress,
          tokenId: course.tokenId,
          completionDate,
          expiryDate,
          txHash: tx.receipt?.transactionHash || "",
        })
        .returning();

      return { success: true, completion, txHash: tx.receipt?.transactionHash };
    }),

  // Protected: Get my completions
  getMyCompletions: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.courseCompletions.findMany({
      where: eq(courseCompletions.userId, ctx.session!.user.id),
      with: { course: true },
      orderBy: desc(courseCompletions.completionDate),
    });
  }),

  // Admin: Get all users (for dropdown)
  getAllUsers: protectedProcedure.query(async ({ ctx }) => {
    // TODO: Check if admin
    return ctx.db.query.user.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
      },
    });
  }),
});
```

### proofRouter

Located in `packages/api/src/router/proof.ts`:

```ts
import crypto from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { courseCompletions, courses, proofs } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const proofRouter = createTRPCRouter({
  // Protected: Generate proof for a completion
  generateProof: protectedProcedure
    .input(z.object({ completionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Verify user owns this completion
      const completion = await ctx.db.query.courseCompletions.findFirst({
        where: and(
          eq(courseCompletions.id, input.completionId),
          eq(courseCompletions.userId, ctx.session!.user.id),
        ),
        with: { course: true },
      });
      if (!completion) throw new Error("Completion not found");

      // 2. Generate proof hash
      const proofHash = crypto
        .createHash("sha256")
        .update(
          `${ctx.session!.user.id}-${completion.tokenId}-${Date.now()}-${Math.random()}`,
        )
        .digest("hex");

      // 3. Save proof record (30-day expiry by default)
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const [proof] = await ctx.db
        .insert(proofs)
        .values({
          proofHash,
          userId: ctx.session!.user.id,
          courseId: completion.courseId,
          tokenId: completion.tokenId,
          expiresAt,
        })
        .returning();

      const proofUrl = `${process.env.NEXT_PUBLIC_APP_URL}/proof/${proofHash}`;
      return { proofHash, proofUrl, proof };
    }),

  // Public: Verify proof
  verifyProof: publicProcedure
    .input(z.object({ proofHash: z.string() }))
    .query(async ({ ctx, input }) => {
      const proof = await ctx.db.query.proofs.findFirst({
        where: eq(proofs.proofHash, input.proofHash),
        with: {
          course: true,
          user: {
            columns: { name: true, email: true },
          },
        },
      });

      if (!proof) {
        return { valid: false, reason: "Proof not found" };
      }

      if (proof.isRevoked) {
        return { valid: false, reason: "Proof has been revoked" };
      }

      if (proof.expiresAt && proof.expiresAt < new Date()) {
        return { valid: false, reason: "Proof has expired" };
      }

      return {
        valid: true,
        userName: proof.user?.name || "Anonymous",
        courseName: proof.course.courseName,
        courseCode: proof.course.courseCode,
        tokenId: proof.tokenId,
        createdAt: proof.createdAt,
        expiresAt: proof.expiresAt,
      };
    }),

  // Protected: List my proofs
  listMyProofs: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.proofs.findMany({
      where: eq(proofs.userId, ctx.session!.user.id),
      with: { course: true },
      orderBy: desc(proofs.createdAt),
    });
  }),

  // Protected: Revoke a proof
  revokeProof: protectedProcedure
    .input(z.object({ proofId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this proof
      const proof = await ctx.db.query.proofs.findFirst({
        where: and(
          eq(proofs.id, input.proofId),
          eq(proofs.userId, ctx.session!.user.id),
        ),
      });
      if (!proof) throw new Error("Proof not found");

      const [updated] = await ctx.db
        .update(proofs)
        .set({ isRevoked: true })
        .where(eq(proofs.id, input.proofId))
        .returning();

      return updated;
    }),
});
```

### Root Router

Update `packages/api/src/root.ts`:

```ts
import { courseRouter } from "./router/course";
import { nftRouter } from "./router/nft";
import { proofRouter } from "./router/proof";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  course: courseRouter,
  nft: nftRouter,
  proof: proofRouter,
});

export type AppRouter = typeof appRouter;
```

---

## UI Components & Routes

### Shared Components (packages/ui)

#### 1. CourseFormCard

```ts
// packages/ui/src/course-form-card.tsx
"use client";

import { ReactNode } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

interface CourseFormCardProps {
  initialCourse?: {
    id?: string;
    courseCode: string;
    courseName: string;
    description?: string;
    imageUri: string;
    defaultExpiryDays: number;
    tokenId: number;
    contractAddress: string;
  };
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
  submitLabel?: string;
}

export function CourseFormCard({
  initialCourse,
  onSubmit,
  isSubmitting,
  submitLabel = "Create Course",
}: CourseFormCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialCourse ? "Edit Course" : "Create New Course"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            await onSubmit(Object.fromEntries(formData));
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="courseCode">Course Code *</Label>
            <Input
              id="courseCode"
              name="courseCode"
              defaultValue={initialCourse?.courseCode}
              required
              placeholder="BC101"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="courseName">Course Name *</Label>
            <Input
              id="courseName"
              name="courseName"
              defaultValue={initialCourse?.courseName}
              required
              placeholder="Introduction to Blockchain"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={initialCourse?.description}
              placeholder="Brief description of the course..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUri">NFT Image URL *</Label>
            <Input
              id="imageUri"
              name="imageUri"
              type="url"
              defaultValue={initialCourse?.imageUri}
              required
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultExpiryDays">Default Expiry (days) *</Label>
            <Input
              id="defaultExpiryDays"
              name="defaultExpiryDays"
              type="number"
              defaultValue={initialCourse?.defaultExpiryDays ?? 0}
              min="0"
              required
            />
            <p className="text-xs text-muted-foreground">0 = no expiry</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tokenId">ERC-1155 Token ID *</Label>
            <Input
              id="tokenId"
              name="tokenId"
              type="number"
              defaultValue={initialCourse?.tokenId}
              min="1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contractAddress">Contract Address *</Label>
            <Input
              id="contractAddress"
              name="contractAddress"
              defaultValue={initialCourse?.contractAddress}
              required
              placeholder="0x..."
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : submitLabel}
            </Button>
            <Button type="button" variant="outline">Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

#### 2. AdminMintCertificateCard

```ts
// packages/ui/src/admin-mint-certificate-card.tsx
"use client";

import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Label } from "./label";

interface User {
  id: string;
  email: string;
  name: string;
}

interface Course {
  id: string;
  courseCode: string;
  courseName: string;
}

interface AdminMintCertificateCardProps {
  users: User[];
  courses: Course[];
  onMint: (userEmail: string, courseCode: string) => Promise<void>;
  isLoading: boolean;
}

export function AdminMintCertificateCard({
  users,
  courses,
  onMint,
  isLoading,
}: AdminMintCertificateCardProps) {
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

  const handleMint = async () => {
    if (!selectedUser || !selectedCourse) return;
    await onMint(selectedUser, selectedCourse);
    setSelectedUser("");
    setSelectedCourse("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mint Course Certificate</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Select User</Label>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a user..." />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.email}>
                  {u.name} ({u.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Select Course</Label>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a course..." />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.courseCode}>
                  {c.courseName} ({c.courseCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleMint}
          disabled={isLoading || !selectedUser || !selectedCourse}
          className="w-full"
        >
          {isLoading ? "Minting..." : "Mint Certificate"}
        </Button>
      </CardContent>
    </Card>
  );
}
```

#### 3. CompletedCourseCard

```ts
// packages/ui/src/completed-course-card.tsx
"use client";

import Image from "next/image";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";

interface CompletedCourseCardProps {
  courseName: string;
  courseCode: string;
  completionDate: Date;
  expiryDate?: Date | null;
  tokenId: number;
  imageUri?: string;
  onGenerateProof: () => void;
  isGeneratingProof?: boolean;
}

export function CompletedCourseCard({
  courseName,
  courseCode,
  completionDate,
  expiryDate,
  tokenId,
  imageUri,
  onGenerateProof,
  isGeneratingProof,
}: CompletedCourseCardProps) {
  const isExpired = expiryDate && expiryDate < new Date();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {imageUri && (
        <div className="relative w-full h-32">
          <Image
            src={imageUri}
            alt={courseName}
            fill
            className="object-cover"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg">{courseName}</CardTitle>
            <p className="text-sm text-muted-foreground">Code: {courseCode}</p>
          </div>
          {isExpired ? (
            <Badge variant="destructive">Expired</Badge>
          ) : expiryDate ? (
            <Badge variant="secondary">Active</Badge>
          ) : (
            <Badge variant="outline">No Expiry</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Completed: {completionDate.toLocaleDateString()}</p>
          {expiryDate && (
            <p>Expires: {expiryDate.toLocaleDateString()}</p>
          )}
          <p className="font-mono text-xs">Token: {tokenId}</p>
        </div>
        <Button
          onClick={onGenerateProof}
          disabled={isGeneratingProof || isExpired}
          className="w-full"
        >
          {isGeneratingProof ? "Generating..." : "Generate Proof"}
        </Button>
      </CardContent>
    </Card>
  );
}
```

#### 4. ProofVerificationCard

```ts
// packages/ui/src/proof-verification-card.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { CheckCircle2, XCircle } from "lucide-react";

interface ProofVerificationCardProps {
  valid: boolean;
  reason?: string;
  userName?: string;
  courseName?: string;
  courseCode?: string;
  tokenId?: number;
  createdAt?: Date;
  expiresAt?: Date | null;
}

export function ProofVerificationCard({
  valid,
  reason,
  userName,
  courseName,
  courseCode,
  tokenId,
  createdAt,
  expiresAt,
}: ProofVerificationCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {valid ? (
            <>
              <CheckCircle2 className="text-green-500" size={24} />
              <CardTitle>Completion Verified ✓</CardTitle>
            </>
          ) : (
            <>
              <XCircle className="text-red-500" size={24} />
              <CardTitle>Invalid Proof</CardTitle>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {valid ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Recipient</p>
              <p className="font-semibold">{userName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Course</p>
              <p className="font-semibold">
                {courseName} ({courseCode})
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Token ID</p>
                <p className="font-mono text-sm">{tokenId}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Verified On</p>
                <p className="text-sm">{createdAt?.toLocaleDateString()}</p>
              </div>
            </div>
            {expiresAt && (
              <div>
                <p className="text-xs text-muted-foreground">Valid Until</p>
                <p className="text-sm">{expiresAt.toLocaleDateString()}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">{reason}</p>
        )}
      </CardContent>
    </Card>
  );
}
```

### Next.js App Routes

#### 1. Admin: Mint page (`apps/nextjs/src/app/admin/page.tsx`)

```ts
"use client";

import { api } from "~/trpc/react";
import { AdminMintCertificateCard } from "@acme/ui";
import { useToast } from "@acme/ui/use-toast";

export default function AdminPage() {
  const { toast } = useToast();

  const { data: users, isLoading: usersLoading } = api.nft.getAllUsers.useQuery();
  const { data: courses, isLoading: coursesLoading } = api.course.listCourses.useQuery();
  const mintMutation = api.nft.mintCompletion.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Certificate minted!" });
    },
    onError: (e) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const handleMint = async (userEmail: string, courseCode: string) => {
    mintMutation.mutate({ userEmail, courseCode });
  };

  if (usersLoading || coursesLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
      <AdminMintCertificateCard
        users={users || []}
        courses={courses || []}
        onMint={handleMint}
        isLoading={mintMutation.isPending}
      />
    </div>
  );
}
```

#### 2. User Dashboard: Courses (`apps/nextjs/src/app/dashboard/courses/page.tsx`)

```ts
"use client";

import { api } from "~/trpc/react";
import { CompletedCourseCard } from "@acme/ui";
import { useToast } from "@acme/ui/use-toast";

export default function MyCoursesPage() {
  const { toast } = useToast();

  const { data: completions, isLoading } = api.nft.getMyCompletions.useQuery();
  const generateProofMutation = api.proof.generateProof.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Proof Generated!",
        description: `Share this link: ${data.proofUrl}`,
      });
      // Copy to clipboard
      navigator.clipboard.writeText(data.proofUrl);
    },
    onError: (e) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">My Certificates</h1>
      {!completions || completions.length === 0 ? (
        <p className="text-muted-foreground">No certificates yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completions.map((c) => (
            <CompletedCourseCard
              key={c.id}
              courseName={c.course.courseName}
              courseCode={c.course.courseCode}
              completionDate={c.completionDate}
              expiryDate={c.expiryDate}
              tokenId={c.tokenId}
              imageUri={c.course.imageUri}
              onGenerateProof={() =>
                generateProofMutation.mutate({ completionId: c.id })
              }
              isGeneratingProof={generateProofMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

#### 3. Public: Courses list (`apps/nextjs/src/app/courses/page.tsx`)

```ts
"use client";

import Image from "next/image";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

export default function CoursesPage() {
  const { data: courses, isLoading } = api.course.listCourses.useQuery();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Available Courses</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses?.map((course) => (
          <Card key={course.id}>
            {course.imageUri && (
              <div className="relative w-full h-40">
                <Image
                  src={course.imageUri}
                  alt={course.courseName}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <CardHeader>
              <CardTitle>{course.courseName}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Code: {course.courseCode}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {course.description && (
                <p className="text-sm">{course.description}</p>
              )}
              <Link href={`/courses/${course.courseCode}`}>
                <Button className="w-full">View Details</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

#### 4. Public: Course detail (`apps/nextjs/src/app/courses/[courseCode]/page.tsx`)

```ts
"use client";

import Image from "next/image";
import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

export default function CourseDetailPage({
  params,
}: {
  params: { courseCode: string };
}) {
  const { data: course, isLoading } = api.course.getCourseByCode.useQuery({
    courseCode: params.courseCode,
  });

  if (isLoading) return <div>Loading...</div>;
  if (!course) return <div>Course not found</div>;

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        {course.imageUri && (
          <div className="relative w-full h-64">
            <Image
              src={course.imageUri}
              alt={course.courseName}
              fill
              className="object-cover"
            />
          </div>
        )}
        <CardHeader>
          <CardTitle className="text-3xl">{course.courseName}</CardTitle>
          <p className="text-lg text-muted-foreground">
            Code: {course.courseCode}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {course.description && (
            <div>
              <h2 className="font-semibold mb-2">Description</h2>
              <p>{course.description}</p>
            </div>
          )}

          <div>
            <h2 className="font-semibold mb-2">On-Chain Details</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-mono text-xs text-muted-foreground">
                  Contract: {course.contractAddress}
                </span>
              </p>
              <p>
                <span className="font-mono text-xs text-muted-foreground">
                  Token ID: {course.tokenId}
                </span>
              </p>
            </div>
          </div>

          {course.defaultExpiryDays > 0 && (
            <div>
              <h2 className="font-semibold mb-2">Certificate Validity</h2>
              <p className="text-sm">
                Valid for {course.defaultExpiryDays} days after completion.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 5. Public: Proof verification (`apps/nextjs/src/app/proof/[hash]/page.tsx`)

```ts
"use client";

import { api } from "~/trpc/react";
import { ProofVerificationCard } from "@acme/ui";

export default function ProofPage({ params }: { params: { hash: string } }) {
  const { data: result, isLoading } = api.proof.verifyProof.useQuery({
    proofHash: params.hash,
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        {result && (
          <ProofVerificationCard
            valid={result.valid}
            reason={result.reason}
            userName={result.userName}
            courseName={result.courseName}
            courseCode={result.courseCode}
            tokenId={result.tokenId}
            createdAt={result.createdAt}
            expiresAt={result.expiresAt}
          />
        )}
      </div>
    </div>
  );
}
```

---

## Smart Contract Setup

### ERC-1155 Contract

Deploy a simple ERC-1155 contract (use Thirdweb's or deploy custom):

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CourseNFT is ERC1155, Ownable {
  uint256 public nextTokenId;

  mapping(uint256 => string) public tokenURIs;
  mapping(uint256 => string) public courseNames;

  event CourseMinted(address indexed to, uint256 indexed tokenId, string courseName);

  constructor() ERC1155("") Ownable(msg.sender) {}

  function mintCompletion(
    address to,
    string memory courseName,
    string memory uri
  ) external onlyOwner returns (uint256) {
    uint256 tokenId = nextTokenId++;
    courseNames[tokenId] = courseName;
    tokenURIs[tokenId] = uri;
    _mint(to, tokenId, 1, "");
    emit CourseMinted(to, tokenId, courseName);
    return tokenId;
  }

  function uri(uint256 tokenId) public view override returns (string memory) {
    return tokenURIs[tokenId];
  }
}
```

**Deploy via Thirdweb Dashboard or CLI:**

```bash
npx thirdweb deploy
# Follow prompts, deploy to Mumbai/Amoy testnet
# Copy contract address to .env
```

---

## Hour-by-Hour Timeline

### Hour 0–1: Setup & Schema

**All Team:**

- [ ] Clone repo; install deps: `pnpm install`
- [ ] Copy `.env.example` → `.env.local`
- [ ] Run `pnpm --filter @acme/auth generate` (Better Auth schema)
- [ ] Add courses schema to `packages/db/src/schema/courses.ts` (provided above)
- [ ] Run `pnpm db:push` to sync schema to Postgres

**Developer 1:**

- [ ] Prepare smart contract (use thirdweb template or deploy test version)

### Hour 1–3: tRPC Routers & Backend

**Developer 2:**

- [ ] Create `packages/api/src/router/course.ts` with all course procedures
- [ ] Create `packages/api/src/router/nft.ts` with mintCompletion + getMyCompletions
- [ ] Create `packages/api/src/router/proof.ts` with generateProof + verifyProof
- [ ] Update `packages/api/src/root.ts` to include all routers
- [ ] Test locally: `pnpm dev` and navigate to tRPC API docs

**Developer 1:**

- [ ] Deploy contract to testnet
- [ ] Fill in `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local`
- [ ] Test thirdweb SDK setup locally

### Hour 3–5: UI Components & Admin Page

**Developer 3:**

- [ ] Add to `packages/ui/src`:
  - `course-form-card.tsx`
  - `admin-mint-certificate-card.tsx`
  - `completed-course-card.tsx`
  - `proof-verification-card.tsx`
- [ ] Update `packages/ui/src/index.tsx` to export new components
- [ ] Build admin page: `apps/nextjs/src/app/admin/page.tsx`

**Developer 1 & 2:**

- [ ] Review + test components locally

### Hour 5–7: User Dashboard & Public Pages

**Developer 3:**

- [ ] Build `apps/nextjs/src/app/dashboard/courses/page.tsx`
- [ ] Build `apps/nextjs/src/app/courses/page.tsx` (public list)
- [ ] Build `apps/nextjs/src/app/courses/[courseCode]/page.tsx` (course detail)
- [ ] Build `apps/nextjs/src/app/proof/[hash]/page.tsx` (proof verification)
- [ ] Add basic layout/navigation

### Hour 7–9: Integration & Testing

**All Team:**

- [ ] End-to-end flow test:
  1. Admin creates course (DB + form)
  2. Admin mints to user (tRPC + blockchain)
  3. User views completions (dashboard)
  4. User generates proof (tRPC + DB)
  5. Verification link works (public page)
- [ ] Fix bugs & type errors
- [ ] Test on mobile viewport

### Hour 9–10: Polish & Deployment Prep

**All Team:**

- [ ] Add loading states + error handling
- [ ] Add toast notifications for feedback
- [ ] Test responsiveness (shadcn + Tailwind 4 defaults should cover this)
- [ ] Prepare `.env` for Vercel deployment

### Hour 10–11: Deployment

**Developer 2:**

- [ ] Deploy to Vercel:
  ```bash
  pnpm install -g vercel
  vercel --prod
  ```
- [ ] Add environment variables in Vercel dashboard
- [ ] Test deployed site

### Hour 11–12: Demo Prep & Presentation

**All Team:**

- [ ] Record or prepare 2-minute demo script
- [ ] Practice walkthrough:
  1. Show course list (public)
  2. Admin logs in & creates course
  3. Admin mints to user
  4. User views certificate
  5. User generates proof
  6. Share proof link (show verification page)
- [ ] Prepare slides:
  - Slide 1: Problem
  - Slide 2: Solution
  - Slide 3–4: Live demo
  - Slide 5: Tech stack (T3 Turbo, Thirdweb, Postgres)
  - Slide 6: Next steps
- [ ] Backup: record video demo

---

## Implementation Checklists

### Database / Drizzle

- [ ] Add `packages/db/src/schema/courses.ts` with `courses`, `courseCompletions`, `proofs` tables
- [ ] Update `packages/db/src/schema/index.ts` to export all tables
- [ ] Run `pnpm db:push`
- [ ] Verify tables in Supabase dashboard

### tRPC Routers

- [ ] Create `packages/api/src/router/course.ts` (listCourses, getCourseByCode, createCourse, updateCourse)
- [ ] Create `packages/api/src/router/nft.ts` (mintCompletion, getMyCompletions, getAllUsers)
- [ ] Create `packages/api/src/router/proof.ts` (generateProof, verifyProof, listMyProofs, revokeProof)
- [ ] Update `packages/api/src/root.ts` to include all routers
- [ ] Ensure all procedures have correct access levels (public/protectedProcedure)
- [ ] Test each procedure locally with tRPC devtools

### Smart Contract

- [ ] Deploy ERC-1155 contract to testnet (or use Thirdweb contract template)
- [ ] Get contract address
- [ ] Get or assign `tokenId` for each course
- [ ] Test minting locally via thirdweb SDK

### UI Components (packages/ui)

- [ ] CourseFormCard (create/edit courses)
- [ ] AdminMintCertificateCard (select user + course + mint)
- [ ] CompletedCourseCard (show completion + generate proof button)
- [ ] ProofVerificationCard (verify proof on public page)
- [ ] All components exported from `index.tsx`

### Next.js Pages (apps/nextjs)

- [ ] `/admin` (admin page with mint form)
- [ ] `/dashboard/courses` (my completions)
- [ ] `/courses` (public course list)
- [ ] `/courses/[courseCode]` (course detail)
- [ ] `/proof/[hash]` (proof verification)
- [ ] Layout + navigation wired up

### Environment & Deployment

- [ ] `.env.local` has all required keys:
  - `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`
  - `THIRDWEB_SECRET_KEY`
  - `NEXT_PUBLIC_CONTRACT_ADDRESS`
  - `NEXT_PUBLIC_APP_URL`
  - `DATABASE_URL`
  - `BETTER_AUTH_SECRET`
  - `BETTER_AUTH_URL`
- [ ] Vercel configured with all env vars
- [ ] Deployed to production URL

---

## Demo Script

### Setup (Before Demo)

- Have a course pre-created in DB (or create one live in 30s)
- Have 1–2 test user accounts already registered
- Keep contract ABI/address handy for reference

### Demo Flow (2 Minutes)

**Slide 1: Problem (15s)**

> "Blockchain-verified credentials. Current state: employers can't verify course completions. Our solution: NFT certificates on the blockchain."

**Slide 2: Demo – Admin Mints (30s)**

1. Open `/admin` (already logged in as admin)
2. Select user from dropdown (e.g., "alice@example.com")
3. Select course from dropdown (e.g., "BC101 – Intro to Blockchain")
4. Click "Mint Certificate"
5. Show success toast + tx hash

**Slide 3: Demo – User Views Completion (30s)**

1. Log out; log in as regular user (alice@example.com)
2. Navigate to `/dashboard/courses`
3. Show completed course card with course image + name + "Generate Proof" button
4. Click "Generate Proof" → show proof URL copied to clipboard

**Slide 4: Demo – Public Verification (30s)**

1. Open proof URL in new tab (e.g., `/proof/abc123...`)
2. Show green "Verified ✓" card with course name + user name + date
3. Show contract address + token ID

**Slide 5: Architecture (15s)**

> "Tech stack: Next.js 15, Tailwind 4, shadcn, Drizzle, Better Auth, tRPC, Thirdweb SDK, ERC-1155 on Polygon. Monorepo with T3 Turbo."

**Slide 6: Next Steps (15s)**

> "Post-hackathon: real signature-based proofs, auto-expiry burns, LMS integrations, multi-chain support."

---

## Deployment & Environment

### Environment Variables

**Create `.env.local` (root):**

```env
# Database (Supabase Postgres)
DATABASE_URL="postgresql://user:pass@host:5432/db"
POSTGRES_URL_NON_POOLING="postgresql://..." # for migrations

# Better Auth
BETTER_AUTH_SECRET="random_secret_key"
BETTER_AUTH_URL="http://localhost:3000"

# Thirdweb
NEXT_PUBLIC_THIRDWEB_CLIENT_ID="your_client_id"
THIRDWEB_SECRET_KEY="your_secret_key"

# Smart Contract
NEXT_PUBLIC_CONTRACT_ADDRESS="0x..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Vercel Deployment

1. **Connect repo to Vercel**
   - Select `apps/nextjs` as root directory
   - Vercel auto-detects Turborepo

2. **Set environment variables in Vercel dashboard:**
   - All vars from `.env.local` (with `NEXT_PUBLIC_` vars visible in browser)

3. **Deploy:**

   ```bash
   vercel --prod
   ```

4. **Run migrations on Vercel:**
   ```bash
   pnpm db:push
   ```

### Quick Troubleshooting

| Issue                             | Solution                                                            |
| --------------------------------- | ------------------------------------------------------------------- |
| `Cannot find module @acme/db`     | Run `pnpm install` in root                                          |
| `DATABASE_URL not set`            | Ensure `.env.local` is in root, not just `apps/nextjs`              |
| `tRPC router not found`           | Check `packages/api/src/root.ts` exports all routers                |
| `Mint fails: contract call error` | Check contract address + admin private key in `THIRDWEB_SECRET_KEY` |
| `Proof not verifying`             | Ensure `proofs` table is populated; check `isRevoked` status        |

---

## Success Criteria

- ✅ Admin can log in and mint certificates to users
- ✅ Users can view completed courses
- ✅ Users can generate proofs (shareable links)
- ✅ Proofs can be verified publicly (no auth needed)
- ✅ All data persisted in Postgres
- ✅ Contract minting works on testnet
- ✅ UI is responsive and uses shadcn + Tailwind
- ✅ Demo runs without errors
- ✅ Deployed to Vercel and accessible via public URL

---

## Optional Stretch Goals (If Time)

1. **Real signatures:** Use `signMessage` to create cryptographic proofs instead of just hash tokens.
2. **Batch operations:** Admin can import CSV of users and mint to all at once.
3. **Image upload:** Admin can upload course images to IPFS directly (instead of URL).
4. **Auto-expiry:** Background job to auto-burn NFTs when `expiryDate` passes.
5. **Email notifications:** Notify user when NFT is minted to them.
6. **Profile page:** User can view/edit their profile (name, email, wallet).
7. **Analytics:** Admin dashboard showing mint counts, top courses, etc.
8. **Mobile responsiveness:** Test thoroughly on phones (likely already good with Tailwind).

---

## References

- **T3 Turbo:** https://github.com/t3-oss/create-t3-turbo
- **Better Auth Docs:** https://www.better-auth.com
- **Drizzle ORM:** https://orm.drizzle.team
- **tRPC:** https://trpc.io
- **shadcn/ui:** https://ui.shadcn.com
- **Tailwind CSS v4:** https://tailwindcss.com
- **Thirdweb SDK v5:** https://portal.thirdweb.com/typescript/v5
- **Next.js 15:** https://nextjs.org/docs

---

**Good luck at the Tanda Hackathon! 🚀**
