import { Module } from '@nestjs/common';
import { AuthModule } from 'auth/auth.module';
import { UserModule } from 'user/user.module';
import { PolyFunctionModule } from 'poly-function/poly-function.module';
import { TeachModule } from 'teach/teach.module';
import { PrismaModule } from 'prisma/prisma.module';
import { ChatModule } from 'chat/chat.module';
import { EventModule } from 'event/event.module';

@Module({
  imports: [AuthModule, UserModule, PolyFunctionModule, TeachModule, PrismaModule, ChatModule, EventModule],
})
export class AppModule {
}
