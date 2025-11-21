# Naming Conventions

Pragmatic naming standards for consistency and readability.

## Files

- **kebab-case** for all files: `user-profile.tsx`, `auth-schema.ts`
- `.tsx` for React components, `.ts` for utilities
- `.test.ts` suffix for tests

## Code

| Type | Convention | Example |
|------|------------|---------|
| React Components | PascalCase | `UserProfile`, `Button` |
| Drizzle Tables | PascalCase | `Post`, `User` |
| Zod Schemas | PascalCase + Schema suffix | `CreatePostSchema` |
| tRPC Routers | camelCase + Router suffix | `postRouter` |
| Functions/Variables | camelCase | `getUserById`, `isLoading` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT` |

## Packages

- Use `@acme/` namespace for all internal packages
- Package names in kebab-case: `@acme/db`, `@acme/validators`
