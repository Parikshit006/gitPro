import { PrismaClient } from '@prisma/client';

/**
 * Shared Prisma Client
 *
 * A single PrismaClient instance is shared across the entire application.
 * Creating multiple instances opens redundant database connection pools,
 * exhausting PostgreSQL's connection limit under load.
 */
export const prisma = new PrismaClient();
