import { Body, Controller, Delete, Param, Post, Res, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from 'auth/api-key-auth-guard.service';
import { ApiKeyDto, CreateApiKeyDto, Role } from '@poly/common';
import { UserService } from 'user/user.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly userService: UserService) {
  }

  @UseGuards(new ApiKeyGuard([Role.Admin]))
  @Post('api-key')
  public async createApiKey(@Body() createApiKeyDto: CreateApiKeyDto): Promise<ApiKeyDto> {
    const user = await this.userService.createUser(createApiKeyDto.name);
    return {
      apiKey: user.apiKey,
    };
  }

  @UseGuards(new ApiKeyGuard([Role.Admin]))
  @Delete('api-key/:apiKey')
  public async deleteApiKey(@Res() res, @Param('apiKey') apiKey: string) {
    await this.userService.deleteUserByApiKey(apiKey);
    res.status(204).send();
  }
}
