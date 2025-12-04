# Dependency Management Standards

## Overview

This document outlines best practices for managing npm dependencies, versioning strategies, and security considerations.

## Current Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 14.2.32 | React framework |
| `react` | 18.x | UI library |
| `@prisma/client` | 6.19.0 | Database ORM |
| `zod` | 4.1.13 | Schema validation |
| `bcryptjs` | 2.4.3 | Password hashing |
| `@azure/storage-blob` | 12.x | File storage |
| `tailwindcss` | 3.4.1 | CSS framework |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | 5.9.3 | Type checking |
| `prisma` | 6.19.0 | Database tooling |
| `eslint` | 8.x | Linting |
| `jest` | 29.x | Testing |
| `@testing-library/react` | 14.x | Component testing |

## Version Pinning Strategy

### Standard: Use Exact Versions for Critical Dependencies

```json
{
  "dependencies": {
    "next": "14.2.32",
    "react": "^18.0.0",
    "@prisma/client": "6.19.0",
    "zod": "^4.0.0"
  }
}
```

| Strategy | When to Use |
|----------|-------------|
| **Exact** (`14.2.32`) | Framework, ORM, critical libs |
| **Minor** (`^18.0.0`) | Stable, well-tested libs |
| **Patch** (`~3.4.0`) | Libraries with breaking patches |

### Lockfile

```bash
# Always commit package-lock.json
git add package-lock.json

# Use ci for reproducible installs
npm ci  # Not npm install
```

## Adding Dependencies

### Standard: Evaluate Before Adding

```markdown
## Dependency Evaluation Checklist

- [ ] Is this necessary? Can we use built-in APIs?
- [ ] Is it actively maintained?
- [ ] What's the bundle size impact?
- [ ] Are there security vulnerabilities?
- [ ] Does the license allow commercial use?
- [ ] How many transitive dependencies?
```

### Size Analysis

```bash
# Check bundle impact before adding
npx bundlephobia-cli <package-name>

# Or use the website
# https://bundlephobia.com/package/<package-name>
```

### Preferred Packages

| Need | Recommended | Avoid |
|------|-------------|-------|
| **Validation** | Zod | Joi (larger) |
| **Dates** | date-fns | Moment.js (deprecated) |
| **HTTP** | fetch (native) | axios (for simple cases) |
| **Forms** | Native + Zod | react-hook-form (if simple forms) |
| **State** | React Context | Redux (unless complex) |

## Updating Dependencies

### Standard: Regular Update Cadence

```bash
# Check for outdated packages
npm outdated

# Update minor/patch versions
npm update

# Update to latest (careful!)
npm install <package>@latest
```

### Update Workflow

```markdown
## Monthly Dependency Update Process

1. Create branch: `chore/dependency-updates`
2. Run `npm outdated` to review
3. Update dependencies in order:
   - Patch versions first
   - Minor versions next
   - Major versions carefully
4. Run full test suite
5. Check build succeeds
6. Deploy to staging
7. Merge if all passes
```

### Breaking Changes

```bash
# Before major version update:
# 1. Read CHANGELOG/migration guide
# 2. Check for deprecation warnings
# 3. Test in isolation

# Example: Updating Prisma
npm install prisma@latest @prisma/client@latest
npx prisma generate
npm test
```

## Security

### Standard: Regular Audits

```bash
# Run security audit
npm audit

# Fix automatically where possible
npm audit fix

# For breaking fixes (review first!)
npm audit fix --force
```

### Automated Security

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    groups:
      development:
        dependency-type: "development"
      production:
        dependency-type: "production"
```

### Critical Vulnerability Response

| Severity | Response Time | Action |
|----------|---------------|--------|
| **Critical** | Same day | Immediate patch |
| **High** | 1-3 days | Priority update |
| **Medium** | 1 week | Scheduled update |
| **Low** | Next sprint | Regular cadence |

## Removing Dependencies

### Standard: Clean Removal

```bash
# Remove package
npm uninstall <package-name>

# Verify no remaining imports
grep -r "<package-name>" src/

# Clean up any config
# (e.g., babel plugins, eslint configs)
```

### Signs a Dependency Should Go

- Not used in codebase
- Functionality available in newer platform APIs
- Better alternative exists
- Security vulnerabilities with no fix
- No longer maintained

## Peer Dependencies

### Standard: Match Peer Requirements

```bash
# Check peer dependency warnings
npm install

# Resolve conflicts explicitly
npm install react@18 react-dom@18
```

## License Compliance

### Allowed Licenses

| License | Status |
|---------|--------|
| MIT | ✅ Allowed |
| Apache 2.0 | ✅ Allowed |
| BSD-2/BSD-3 | ✅ Allowed |
| ISC | ✅ Allowed |
| GPL | ⚠️ Review required |
| LGPL | ⚠️ Review required |

### License Check

```bash
# Install license checker
npm install -g license-checker

# Check all licenses
license-checker --summary
```

## Monorepo Considerations

### Current: Single Package

```json
{
  "name": "twines-and-straps",
  "private": true
}
```

### Future: If Monorepo Needed

```json
{
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}
```

## Dependency Checklist

| Category | Check |
|----------|-------|
| **Version** | Pinned appropriately |
| **Security** | No known vulnerabilities |
| **License** | Compatible with project |
| **Size** | Reasonable bundle impact |
| **Maintenance** | Actively maintained |
| **Lockfile** | Committed to repo |

## Related Documentation

- [Tooling & Dev Experience](../stack/07-tooling-dev-experience.md)
- [Security](./02-security.md)
