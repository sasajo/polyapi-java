import { Body, Controller, Delete, Get, Logger, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from 'auth/api-key-auth-guard.service';
import { ApiKeyDto, CreateApiKeyDto, Role } from '@poly/common';
import { UserService } from 'user/user.service';

@Controller('auth')
export class AuthController {
  private logger: Logger = new Logger(AuthController.name);

  constructor(private readonly userService: UserService) {
  }

  @UseGuards(new ApiKeyGuard([Role.Admin]))
  @Get('api-keys')
  public async getApiKeys(): Promise<ApiKeyDto[]> {
    const users = await this.userService.getUsers();
    return users
      .filter(user => user.role === Role.User)
      .map(user => ({
        name: user.name,
        apiKey: user.apiKey,
      }));
  }

  @UseGuards(new ApiKeyGuard([Role.Admin]))
  @Post('api-keys')
  public async createApiKey(@Body() createApiKeyDto: CreateApiKeyDto): Promise<ApiKeyDto> {
    const user = await this.userService.createUser(createApiKeyDto.name);
    return {
      name: user.name,
      apiKey: user.apiKey,
    };
  }

  @UseGuards(new ApiKeyGuard([Role.Admin]))
  @Delete('api-keys/:apiKey')
  public async deleteApiKey(@Res() res, @Param('apiKey') apiKey: string) {
    await this.userService.deleteUserByApiKey(apiKey);
    res.status(204).send();
  }

  @Get('oauth-callback')
  public async oauthCallback(@Res() res, @Body() body: any, @Query() query: any) {
    this.logger.debug(`OAuth callback with body ${JSON.stringify(body)}`);
    this.logger.debug(`OAuth callback with query params ${JSON.stringify(query)}`);

    res.status(200).send();
  }
}
