import {join} from 'path';
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AuthModule } from 'auth/auth.module';
import { UserModule } from 'user/user.module';
import { PolyFunctionModule } from 'poly-function/poly-function.module';
import { TeachModule } from 'teach/teach.module';
import { PrismaModule } from 'prisma/prisma.module';
import { ChatModule } from 'chat/chat.module';
import { EventModule } from 'event/event.module';
import { WebhookModule } from 'webhook/webhook.module';
import { CommonModule } from 'common/common.module';
import { ConfigModule } from 'config/config.module';
import { AiModule } from 'ai/ai.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'),
      renderPath: '/'
    }),
    AuthModule,
    UserModule,
    PolyFunctionModule,
    TeachModule,
    PrismaModule,
    ChatModule,
    EventModule,
    WebhookModule,
    CommonModule,
    ConfigModule,
    AiModule,
  ],
  exports: [
    ConfigModule,
  ],
})
export class AppModule {
}
