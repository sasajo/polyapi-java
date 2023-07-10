import { PrismaService } from 'prisma/prisma.service';
import { FunctionService } from 'function/function.service';

export interface MigrationContext {
  prisma: PrismaService;
  functionService: FunctionService;
}
