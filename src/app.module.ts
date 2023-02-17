import { Module } from '@nestjs/common';
import { AuthModule } from 'auth/auth.module';
import { UserModule } from 'user/user.module';
import { PolyFunctionModule } from 'poly-function/poly-function.module';
import { TeachModule } from 'teach/teach.module';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [AuthModule, UserModule, PolyFunctionModule, TeachModule, PrismaModule]
})
export class AppModule {
}
