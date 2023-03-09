import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@poly/common';

@Injectable()
export class ApiKeyGuard extends AuthGuard('headerapikey') {
  constructor(private readonly roles: Role[] = [Role.Admin, Role.User]) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const result = (await super.canActivate(context)) as boolean;
    if (!result) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return user && this.roles.includes(user.role);
  }
}
