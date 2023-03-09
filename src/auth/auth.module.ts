import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ApiKeyStrategy } from 'auth/api-key.strategy';
import { UserModule } from 'user/user.module';
import { AuthController } from './auth.controller';

@Module({
  imports: [PassportModule, UserModule],
  providers: [ApiKeyStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
