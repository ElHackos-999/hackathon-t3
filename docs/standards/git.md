# Git Standards

Simple conventions for clear commit history.

## Commit Messages

Use [Conventional Commits](https://conventionalcommits.org):

```text
<type>: <description>
```

**Types:**

- `feat:` - New feature
- `fix:` - Bug fix
- `chore:` - Maintenance, deps, config
- `docs:` - Documentation only
- `refactor:` - Code change without feature/fix

**Examples:**

```text
feat: add user authentication flow
fix: resolve hydration mismatch in posts
chore: update dependencies
```

## Branch Naming

```text
<name>/<type>-<description>
```

Examples: `simon/feat-auth`, `alex/fix-login-bug`

## Quick Tips

- Keep commits small and focused
- Write in imperative mood: "add" not "added"
- No period at the end
