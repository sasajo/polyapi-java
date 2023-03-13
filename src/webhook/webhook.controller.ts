import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { WebhookService } from 'webhook/webhook.service';
import { ApiKeyGuard } from 'auth/api-key-auth-guard.service';
import { RegisterWebhookHandleDto } from '@poly/common';

@Controller('webhooks')
export class WebhookController {
  public constructor(private readonly webhookService: WebhookService) {
  }

  @UseGuards(ApiKeyGuard)
  @Post('register')
  public async registerWebhookHandle(@Req() req, @Body() registerWebhookHandleDto: RegisterWebhookHandleDto) {
    const webhookHandle = await this.webhookService.registerWebhookContextFunction(req.user, registerWebhookHandleDto.context, registerWebhookHandleDto.alias, registerWebhookHandleDto.eventPayload);
    return this.webhookService.toDto(webhookHandle);
  }

  @UseGuards(ApiKeyGuard)
  @Put(':context/:functionAlias')
  public async registerWebhookContextFunction(@Req() req, @Param('context') context: string, @Param('functionAlias') functionAlias: string, @Body() payload: any) {
    const webhookHandle = await this.webhookService.registerWebhookContextFunction(req.user, context, functionAlias, payload);
    return this.webhookService.toDto(webhookHandle);
  }

  @UseGuards(ApiKeyGuard)
  @Put(':functionAlias')
  public async registerWebhookFunction(@Req() req, @Param('functionAlias') functionAlias: string, @Body() payload: any) {
    const webhookHandle = await this.webhookService.registerWebhookContextFunction(req.user, null, functionAlias, payload);
    return this.webhookService.toDto(webhookHandle);
  }

  @Post(':context/:functionAlias')
  public async triggerWebhookContextFunction(@Param('context') context: string, @Param('functionAlias') functionAlias: string, @Body() payload: any) {
    return await this.webhookService.triggerWebhookContextFunction(context, functionAlias, payload);
  }

  @Post(':functionAlias')
  public async triggerWebhookFunction(@Param('functionAlias') functionAlias: string, @Body() payload: any) {
    return await this.webhookService.triggerWebhookContextFunction(null, functionAlias, payload);
  }

  @Post(':id')
  public async triggerWebhookFunctionByID(@Param('id') id: string, @Body() payload: any) {
    return await this.webhookService.triggerWebhookContextFunctionByID(id, payload);
  }

  @UseGuards(ApiKeyGuard)
  @Get()
  public async getWebhookHandles(@Req() req) {
    return (await this.webhookService.getWebhookHandles(req.user))
      .map(handle => this.webhookService.toDto(handle));
  }
}
