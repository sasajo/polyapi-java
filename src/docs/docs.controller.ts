import { Controller, Logger, Get, Post, Delete, UseGuards, Body, Param, Req } from '@nestjs/common';
import { ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { PolyAuthGuard } from 'auth/poly-auth-guard.service';
import { Role } from '@poly/model';
import { DocsService, DocUpdateT } from './docs.service';
import { API_TAG_INTERNAL } from 'common/constants';
import { AuthRequest } from 'common/types';

@ApiSecurity('PolyApiKey')
@Controller()
export class DocsController {
  private readonly logger = new Logger(DocsController.name);

  constructor(private readonly service: DocsService) {}

  @ApiOperation({ tags: [API_TAG_INTERNAL] })
  @UseGuards(new PolyAuthGuard([Role.Admin, Role.SuperAdmin]))
  @Get('docs')
  async docsList(@Req() req: AuthRequest): Promise<unknown> {
    const user = req.user.user;
    if (!user) {
      throw Error('PolyAuthGuard should force user!'); // hack for types
    }
    const docs = await this.service.getDocList(user.tenantId);
    const rv = docs.map((doc) => {
      return {
        id: doc.id,
        context: doc.context,
        title: doc.title,
        text: doc.text,
      };
    });
    return rv;
  }

  @ApiOperation({ tags: [API_TAG_INTERNAL] })
  @UseGuards(new PolyAuthGuard([Role.Admin, Role.SuperAdmin]))
  @Post('docs')
  async docsCreate(@Req() req: AuthRequest, @Body() data: DocUpdateT): Promise<unknown> {
    const user = req.user.user;
    if (!user) {
      throw Error('PolyAuthGuard should force user!'); // hack for types
    }
    const doc = await this.service.createOrUpdateDoc(data, user.tenantId);
    return {
      id: doc.id,
      context: doc.context,
      title: doc.title,
      text: doc.text,
    };
  }

  @ApiOperation({ tags: [API_TAG_INTERNAL] })
  @UseGuards(new PolyAuthGuard([Role.Admin, Role.SuperAdmin]))
  @Delete('docs/:id')
  async docsDelete(@Req() req: AuthRequest, @Param('id') id: string): Promise<unknown> {
    const user = req.user.user;
    if (!user) {
      throw Error('PolyAuthGuard should force user!'); // hack for types
    }
    return await this.service.deleteDoc(id, user.tenantId);
  }
}
