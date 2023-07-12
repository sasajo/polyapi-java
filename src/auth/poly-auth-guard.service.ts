import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@poly/common';
import { AuthData } from 'common/types';
import { Request } from 'express';

@Injectable()
export class PolyAuthGuard extends AuthGuard('bearer') {
  constructor(private readonly roles: Role[] | null = null) {
    super();
  }

  /**
   * If user sends `access_token` through body request payload or query params, `canActivate` throws a 401 Unauthorized error.
   * This is because passport strategy also checks `access_token`, see docs: https://github.com/jaredhanson/passport-http-bearer#making-authenticated-requests
   * Since we are using `access_token` through `Authorization` header, we have to clean key `access_token` from body and query until we execute `canActivate` method.
   */
  private cleanAccessTokenFromBodyAndQuery(request: Request): { bodyCopy: typeof request.body, queryCopy: typeof request.query} {
    const queryCopy = Object.assign({}, request.query);
    const bodyCopy = Object.assign({}, request.body);

    delete request.query['access_token'];

    if (request.headers['content-type']?.match(/application\/json/)) {
      delete request.body['access_token'];
    }

    return {
      bodyCopy,
      queryCopy,
    };
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const {
      bodyCopy,
      queryCopy,
    } = this.cleanAccessTokenFromBodyAndQuery(request);

    const result = (await super.canActivate(context)) as boolean;

    (request as Request).body = bodyCopy;
    (request as Request).query = queryCopy;

    if (!result) {
      return false;
    }

    if (!request.user) {
      return false;
    }

    const { user } = request.user as AuthData;
    if (this.roles && (!user || !this.roles.includes(user.role as Role))) {
      return false;
    }

    return true;
  }
}
