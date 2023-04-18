import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthProviderService } from 'auth-provider/auth-provider.service';
import { CreateAuthProviderDto } from '@poly/common';
import { ApiKeyGuard } from 'auth/api-key-auth-guard.service';

@Controller('auth-providers')
export class AuthProviderController {
  constructor(private readonly service: AuthProviderService) {
  }

  @Get()
  @UseGuards(ApiKeyGuard)
  async getAuthProviders(@Req() req) {
    return (await this.service.getAuthProviders(req.user))
      .map(this.service.toAuthProviderDto);
  }

  @Get(':id')
  @UseGuards(ApiKeyGuard)
  async getAuthProvider(@Req() req, @Param('id') id: string) {
    const authProvider = await this.service.getAuthProvider(req.user, id);
    if (!authProvider) {
      throw new NotFoundException();
    }
    return this.service.toAuthProviderDto(authProvider);
  }

  @Post()
  @UseGuards(ApiKeyGuard)
  async createAuthProvider(@Req() req, @Body() data: CreateAuthProviderDto) {
    const { context, authorizeUrl, tokenUrl, revokeUrl = null, introspectUrl = null, audienceRequired = false } = data;
    return this.service.toAuthProviderDto(
      await this.service.createAuthProvider(req.user, context, authorizeUrl, tokenUrl, revokeUrl, introspectUrl, audienceRequired),
    );
  }

  @Put(':id')
  @UseGuards(ApiKeyGuard)
  async updateAuthProvider(@Req() req, @Param('id') id: string, @Body() data: CreateAuthProviderDto) {
    const { context, authorizeUrl, tokenUrl, revokeUrl = null, introspectUrl = null, audienceRequired = false } = data;

    const authProvider = await this.service.getAuthProvider(req.user, id);
    if (!authProvider) {
      throw new NotFoundException();
    }

    return this.service.toAuthProviderDto(
      await this.service.updateAuthProvider(req.user, authProvider, context, authorizeUrl, tokenUrl, revokeUrl, introspectUrl, audienceRequired),
    );
  }

  @Delete(':id')
  @UseGuards(ApiKeyGuard)
  async deleteAuthProvider(@Req() req, @Param('id') id: string) {
    const authProvider = await this.service.getAuthProvider(req.user, id);
    if (!authProvider) {
      throw new NotFoundException();
    }

    await this.service.deleteAuthProvider(req.user, authProvider);
  }

  // @Post('/auth/:publicId/execute')
  // @UseGuards(ApiKeyGuard)
  // async executeAuthFunction(@Req() req, @Param('publicId') publicId: string, @Body() executeFunctionDto: ExecuteAuthFunctionDto): Promise<ExecuteAuthFunctionResponseDto> {
  //   const authFunction = await this.service.findAuthFunctionByPublicId(publicId);
  //   if (!authFunction) {
  //     throw new HttpException(`Auth function with publicId ${publicId} not found.`, HttpStatus.NOT_FOUND);
  //   }
  //
  //   const {
  //     eventsClientId,
  //     clientId,
  //     clientSecret,
  //     audience = null,
  //     scopes = [],
  //     callbackUrl = null,
  //   } = executeFunctionDto;
  //   return await this.service.executeAuthFunction(req.user, authFunction, eventsClientId, clientId, clientSecret, audience, scopes, callbackUrl);
  // }
  //
  // @Post('/auth/:publicId/revoke')
  // @UseGuards(ApiKeyGuard)
  // async revokeAuthFunction(@Req() req, @Param('publicId') publicId: string, @Body() revokeFunctionDto: RevokeAuthFunctionDto): Promise<void> {
  //   const authFunction = await this.service.findAuthFunctionByPublicId(publicId);
  //   if (!authFunction) {
  //     throw new HttpException(`Auth function with publicId ${publicId} not found.`, HttpStatus.NOT_FOUND);
  //   }
  //
  //   const { clientId, clientSecret } = revokeFunctionDto;
  //   await this.service.revokeAuthFunction(req.user, authFunction, clientId, clientSecret);
  // }
  //
  // @Get('/auth/:publicId/callback')
  // async authFunctionCallback(@Res() res, @Param('publicId') publicId: string, @Query() query: any): Promise<void> {
  //   this.logger.debug(`Auth function callback for ${publicId} with query ${JSON.stringify(query)}`);
  //   const redirectUrl = await this.service.processAuthFunctionCallback(publicId, query);
  //   if (redirectUrl) {
  //     res.redirect(redirectUrl);
  //   }
  // }
}
