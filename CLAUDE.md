# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a T3 Turbo monorepo - a Turborepo-based full-stack TypeScript project. Replace `@acme` namespace with your organization/project name throughout the codebase.

**Tech Stack:**
- Turborepo for monorepo management
- tRPC v11 for type-safe APIs
- Drizzle ORM with Supabase (edge-compatible)
- Better Auth for authentication
- Tailwind CSS v4 (NativeWind v5 for Expo)
- React 19

**System Requirements:**
- Node.js: ^22.21.0
- pnpm: ^10.19.0

## Common Commands

```bash
# Install dependencies
pnpm i

# Development
pnpm dev              # Run all apps
pnpm dev:next         # Run Next.js app only

# Database
pnpm db:push          # Push Drizzle schema to database
pnpm db:studio        # Open Drizzle Studio

# Auth
pnpm auth:generate    # Generate Better Auth schema

# Code quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm format           # Check formatting
pnpm format:fix       # Fix formatting
pnpm typecheck        # Run TypeScript checks
pnpm test             # Run tests

# UI
pnpm ui-add           # Add shadcn/ui components

# Add new package
pnpm turbo gen init
```

## Architecture

```
apps/
  ├─ nextjs/          # Next.js 15 web app
  └─ expo/            # Expo SDK 54 mobile app (React Native 0.81)
packages/
  ├─ api/             # tRPC v11 router definitions
  ├─ auth/            # Better Auth configuration
  ├─ db/              # Drizzle ORM schema & client
  └─ ui/              # Shared UI components (shadcn/ui)
tooling/
  ├─ eslint/          # Shared ESLint presets
  ├─ prettier/        # Shared Prettier config
  ├─ tailwind/        # Shared Tailwind config
  └─ typescript/      # Shared tsconfig
```

**Key patterns:**
- `@acme/api` is a production dependency only in Next.js; other apps use it as devDependency for types only
- Auth schema is generated to `packages/db/src/auth-schema.ts` via Better Auth CLI
- Database is edge-compatible using Vercel Postgres driver
