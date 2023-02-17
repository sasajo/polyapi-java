import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UserService } from 'user/user.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy) {
  constructor(private userService: UserService) {
    super(
      { header: 'X-PolyApiKey', prefix: '' },
      false,
      async (apikey, done) => {
        try {
          const user = await userService.findByApiKey(apikey);
          done(null, user || false);
        } catch (e) {
          done(e);
        }
      },
    );
  }
}
