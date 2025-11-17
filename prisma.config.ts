import 'dotenv/config';

// This file is used to configure Prisma's CLI tooling.
// It is not directly used by the Prisma Client.
// See: https://www.prisma.io/docs/reference/prisma-cli-reference

export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // The datasource url is now read from the schema.prisma file,
  // which in turn reads it from the .env file.
};
