import path from 'node:path'
import { defineConfig } from 'prisma/config'

/**
 * Prisma configuration file
 * 
 * This replaces the deprecated package.json#prisma configuration.
 * See: https://pris.ly/prisma-config
 */
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'tsx prisma/seed.ts',
  },
})
