import { IDataAccess, TStatus, statusCMap } from '@neoncoder/typed-service-response';
import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../lib/prisma';
import { PrismaClientValidationError, PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { sanitizeData } from '@neoncoder/validator-utils';

type TPagination = { page?: number; limit?: number };

abstract class PostgresDBService<K extends string, T = any> implements IDataAccess<K, T> {
  result?: TStatus<K, T>;

  prisma: PrismaClient;

  constructor({ prismaInstance, softDelete = true }: { prismaInstance?: PrismaClient; softDelete: boolean }) {
    this.prisma = prismaInstance ?? getPrismaClient(softDelete);
  }

  abstract getList(...args: any[]): Promise<this>;

  abstract getFullList(...args: any[]): Promise<this>;

  abstract findById(...args: any[]): Promise<this>;

  abstract search(...args: any[]): Promise<this>;

  abstract create(...args: any[]): Promise<this>;

  abstract update(...args: any[]): Promise<this>;

  abstract delete(...args: any[]): Promise<this>;

  abstract batchCreate(...args: any[]): Promise<this>;

  abstract batchUpdate(...args: any[]): Promise<this>;

  abstract batchDelete(...args: any[]): Promise<this>;

  paginate(total: number, limit: number, page: number) {
    const pages = Math.ceil(total / limit) || 1;
    const prev = pages > 1 && page <= pages && page - 1 > 0 ? page - 1 : null;
    const next = pages > 1 && page < pages && page > 0 ? page + 1 : null;
    return { total, page, pages, limit, prev, next };
  }

  formatError(error: any, msg = 'An error occurred') {
    const message = error.message ?? msg;
    console.log({ error });
    if (error instanceof PrismaClientValidationError || error instanceof PrismaClientKnownRequestError) {
      this.result = statusCMap.get(400)!({ error, message });
      return;
    }
    this.result = statusCMap.get(500)!({ error, message });
  }

  sanitize<T extends object>(fields: string[], data: Partial<T>) {
    const sanitizedData = sanitizeData<T>(fields, data);
    return sanitizedData;
  }
}

export { PostgresDBService, TPagination };
