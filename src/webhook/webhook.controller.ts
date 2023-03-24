import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { WebhookService } from 'webhook/webhook.service';
import { ApiKeyGuard } from 'auth/api-key-auth-guard.service';
import { RegisterWebhookHandleDto, UpdateWebhookHandleDto } from '@poly/common';

export const HEADER_ACCEPT_WEBHOOK_HANDLE_DEFINITION = 'application/poly.webhook-handle-definition+json';

@Controller('webhooks')
export class WebhookController {
  public constructor(private readonly webhookService: WebhookService) {
  }

  @UseGuards(ApiKeyGuard)
  @Get()
  public async getWebhookHandles(@Req() req, @Headers('Accept') acceptHeader: string) {
    const useDefinitionDto = acceptHeader === HEADER_ACCEPT_WEBHOOK_HANDLE_DEFINITION;

    // TODO: temporarily disabled to allow all users to see all webhooks
    // const webhookHandles = await this.webhookService.getWebhookHandles(req.user);
    const webhookHandles = await this.webhookService.getAllWebhookHandles();

    if (useDefinitionDto) {
      return webhookHandles.map(handle => this.webhookService.toDefinitionDto(handle));
    } else {
      return webhookHandles.map(handle => this.webhookService.toDto(handle));
    }
  }

  @UseGuards(ApiKeyGuard)
  @Post('register')
  public async registerWebhookHandle(@Req() req, @Body() registerWebhookHandleDto: RegisterWebhookHandleDto) {
    const webhookHandle = await this.webhookService.registerWebhookContextFunction(req.user, registerWebhookHandleDto.context, registerWebhookHandleDto.name, registerWebhookHandleDto.eventPayload);
    return this.webhookService.toDto(webhookHandle);
  }

  @UseGuards(ApiKeyGuard)
  @Put(':context/:name')
  public async registerWebhookContextFunction(@Req() req, @Param('context') context: string, @Param('name') name: string, @Body() payload: any) {
    const webhookHandle = await this.webhookService.registerWebhookContextFunction(req.user, context, name, payload);
    return this.webhookService.toDto(webhookHandle);
  }

  @UseGuards(ApiKeyGuard)
  @Put(':name')
  public async registerWebhookFunction(@Req() req, @Param('name') name: string, @Body() payload: any) {
    const webhookHandle = await this.webhookService.registerWebhookContextFunction(req.user, null, name, payload);
    return this.webhookService.toDto(webhookHandle);
  }

  @Post(':context/:name')
  public async triggerWebhookContextFunction(@Param('context') context: string, @Param('name') name: string, @Body() payload: any) {
    return await this.webhookService.triggerWebhookContextFunction(context, name, payload);
  }

  @Post(':name')
  public async triggerWebhookFunction(@Param('name') name: string, @Body() payload: any) {
    return await this.webhookService.triggerWebhookContextFunction('', name, payload);
  }

  @Patch(':id')
  @UseGuards(ApiKeyGuard)
  public async updateWebhookHandle(@Req() req, @Param('id') id: string, @Body() updateWebhookHandleDto: UpdateWebhookHandleDto) {
    const { context = null, name = null } = updateWebhookHandleDto;
    return this.webhookService.toDto(await this.webhookService.updateWebhookHandle(req.user, id, context, name));
  }

  @Post(':id')
  public async triggerWebhookFunctionByID(@Param('id') id: string, @Body() payload: any) {
    return await this.webhookService.triggerWebhookContextFunctionByID(id, payload);
  }

  @Delete(':id')
  @UseGuards(ApiKeyGuard)
  public async deleteWebhookHandle(@Req() req, @Param('id') id: string) {
    await this.webhookService.deleteWebhookHandle(req.user, id);
  }
}
