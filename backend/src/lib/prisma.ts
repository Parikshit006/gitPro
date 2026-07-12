import { PrismaClient } from '@prisma/client';

/**
 * Shared Prisma Client
 *
 * Purpose:
 *   Creates and exports exactly one shared PrismaClient instance to be used
 *   across the entire application. Every repository must import this shared
 *   instance rather than instantiating its own.
 *
 * Why PrismaClient should be a singleton:
 *   A single instance ensures that the application maintains a single, managed
 *   connection pool to the database. If multiple instances were created, each
 *   would establish its own connection pool, which is highly inefficient and
 *   hard to monitor.
 *
 * Why multiple instances increase connection usage:
 *   PostgreSQL has a hard limit on the number of concurrent connections
 *   it can accept. Every new PrismaClient instance spawns a new pool of
 *   connections. If every repository or request created its own instance,
 *   the application would rapidly exhaust the database's connection limit
 *   under load, leading to application crashes and database lockups.
 *
 * Why repositories should share infrastructure:
 *   Repositories are responsible for data access, but they should not manage
 *   the lifecycle of the database connection itself. By sharing a single
 *   infrastructure instance, repositories remain lightweight, memory usage
 *   is minimized, and connection pooling is centralized and optimized.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
