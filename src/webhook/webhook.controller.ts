import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { WebhookService } from 'webhook/webhook.service';
import { ApiKeyGuard } from 'auth/api-key-auth-guard.service';
import { CreateWebhookHandleDto, UpdateWebhookHandleDto } from '@poly/common';

@Controller('webhooks')
export class WebhookController {
  public constructor(private readonly webhookService: WebhookService) {}

  @UseGuards(ApiKeyGuard)
  @Get()
  public async getWebhookHandles(@Req() req) {
    const webhookHandles = await this.webhookService.getWebhookHandles(req.user);
    return webhookHandles.map((handle) => this.webhookService.toDto(handle));
  }

  @UseGuards(ApiKeyGuard)
  @Get(':id')
  public async getWeebhookHandle(@Req() req, @Param('id') id: string) {
    const webhookHandle = await this.webhookService.getWebhookHandle(req.user, id);

    if (webhookHandle) {
      return this.webhookService.toDto(webhookHandle);
    }

    throw new NotFoundException(`Webhook handle with ID ${id} not found.`);
  }

  @UseGuards(ApiKeyGuard)
  @Post()
  public async createWebhookHandle(@Req() req, @Body() createWebhookHandle: CreateWebhookHandleDto) {
    const { context = '', name, eventPayload, description = '' } = createWebhookHandle;
    const webhookHandle = await this.webhookService.createOrUpdateWebhookHandle(
      req.user,
      context,
      name,
      eventPayload,
      description,
    );
    return this.webhookService.toDto(webhookHandle);
  }

  @Patch(':id')
  @UseGuards(ApiKeyGuard)
  public async updateWebhookHandle(
    @Req() req,
    @Param('id') id: string,
    @Body() updateWebhookHandleDto: UpdateWebhookHandleDto,
  ) {
    const { context = null, name = null, description = null } = updateWebhookHandleDto;
    return this.webhookService.toDto(
      await this.webhookService.updateWebhookHandle(req.user, id, context, name, description),
    );
  }

  @Post(':id')
  public async triggerWebhookHandle(@Param('id') id: string, @Body() payload: any) {
    return await this.webhookService.triggerWebhookHandle(id, payload);
  }

  @Delete(':id')
  @UseGuards(ApiKeyGuard)
  public async deleteWebhookHandle(@Req() req, @Param('id') id: string) {
    await this.webhookService.deleteWebhookHandle(req.user, id);
  }

  @UseGuards(ApiKeyGuard)
  @Put(':context/:name')
  public async registerWebhookContextFunction(
    @Req() req,
    @Param('context') context: string,
    @Param('name') name: string,
    @Body() payload: any,
  ) {
    const webhookHandle = await this.webhookService.createOrUpdateWebhookHandle(req.user, context, name, payload, '');
    return this.webhookService.toDto(webhookHandle);
  }

  @UseGuards(ApiKeyGuard)
  @Put(':name')
  public async registerWebhookFunction(@Req() req, @Param('name') name: string, @Body() payload: any) {
    const webhookHandle = await this.webhookService.createOrUpdateWebhookHandle(req.user, null, name, payload, '');
    return this.webhookService.toDto(webhookHandle);
  }
}
