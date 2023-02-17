import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ApiKeyStrategy } from 'auth/api-key.strategy';
import { UserModule } from 'user/user.module';

@Module({
  imports: [PassportModule, UserModule],
  providers: [ApiKeyStrategy],
})
export class AuthModule {}
