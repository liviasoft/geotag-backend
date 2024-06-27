import { PrismaClient } from '@prisma/client';

// soft delete prisma client
const prisma = new PrismaClient();

// hard delete prisma client
const purgePrisma = new PrismaClient();

export const getPrismaClient = (softDelete = true) => (softDelete ? prisma : purgePrisma);
