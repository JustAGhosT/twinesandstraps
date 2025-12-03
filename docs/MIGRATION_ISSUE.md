# Database Migration Issue

## Summary

This document outlines a known issue with the current database migration file in the `prisma/migrations` directory. The project is configured to use a **PostgreSQL** database, but the existing migration was generated using a temporary **SQLite** environment.

## Problem

Due to environmental constraints (lack of Docker permissions to run a local PostgreSQL instance), the migration file was generated as a workaround. SQLite and PostgreSQL have different SQL dialects and type systems, which means the generated migration file is **not compatible** with the intended PostgreSQL database.

Running `prisma migrate dev` or deploying the current state of the application against a PostgreSQL database will fail.

## Required Action

A new, correct migration must be generated against a PostgreSQL database. This should be addressed in a future pull request as soon as the necessary environment is available.

**Steps to Resolve:**
1. Ensure a local PostgreSQL database is running and accessible.
2. Delete the contents of the `prisma/migrations` directory.
3. Run `npx prisma migrate dev --name init` to generate a new, PostgreSQL-compatible migration.
4. Commit the new migration file.
