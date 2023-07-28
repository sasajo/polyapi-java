import { Injectable, Logger } from '@nestjs/common';
import { DocSection } from '@prisma/client';
import { AiService } from 'ai/ai.service';
import { PrismaService } from 'prisma/prisma.service';

type DocUpdateT = {
  id?: string;
  title: string;
  text: string;
};

@Injectable()
export class DocsService {
  private readonly logger = new Logger(DocsService.name);

  constructor(private readonly prisma: PrismaService, private readonly aiService: AiService) {}

  async getDocList(): Promise<DocSection[]> {
    return this.prisma.docSection.findMany();
  }

  async createOrUpdateDoc(body: DocUpdateT): Promise<DocSection> {
    let doc: DocSection;
    if (typeof body.id === 'string') {
      doc = await this.prisma.docSection.update({
        where: { id: body.id },
        data: { title: body.title, text: body.text },
      });
      return doc;
    } else {
      doc = await this.prisma.docSection.create({
        data: { title: body.title, text: body.text },
      });
    }

    return this.aiService.updateDocVector(doc);
  }

  async deleteDoc(id: string) {
    return await this.prisma.docSection.delete({ where: { id } });
  }
}
