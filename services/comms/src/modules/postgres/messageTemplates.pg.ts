import { Prisma, MessageTemplate, Message } from '@prisma/client';
import { PostgresDBService, TPagination } from './common.pg';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';

export type TMessageTemplateWithIncludes = MessageTemplate & {
  messages?: Message[];
};

export type TMessageTemplateFilters = {
  filters?: Prisma.MessageTemplateWhereInput;
  orderBy?: Prisma.MessageTemplateOrderByWithRelationInput | Prisma.MessageTemplateOrderByWithRelationInput[];
  include?: Prisma.MessageTemplateInclude;
  exclude?: Array<keyof MessageTemplate>;
};

export class MessageTemplatePostgresService extends PostgresDBService<
  'messageTemplate' | 'messageTemplates',
  MessageTemplate
> {
  messageTemplate: MessageTemplate | null;
  fields = [
    'id',
    'name',
    'requiredFields',
    'description',
    'emailTemplate',
    'smsTemplate',
    'pushNotificationTemplate',
    'created',
    'updated',
  ];

  constructor({
    softDelete = false,
    messageTemplate = undefined,
  }: {
    softDelete?: boolean;
    messageTemplate?: MessageTemplate;
  }) {
    super({ softDelete });
    this.messageTemplate = messageTemplate ?? null;
  }

  async getList({ page = 1, limit = 25, filters, orderBy, include }: TMessageTemplateFilters & TPagination) {
    try {
      const q = {
        take: limit,
        skip: (page - 1) * limit,
        where: { ...filters },
        orderBy,
        include: this.getIncludes(include),
      };
      const [messageTemplates, total] = await this.prisma.$transaction([
        this.prisma.messageTemplate.findMany({ ...q }),
        this.prisma.messageTemplate.count({ where: { ...filters } }),
      ]);
      const { pages, prev, next } = this.paginate(total, limit, page);
      this.result = statusTMap.get('OK')!<'messageTemplates', MessageTemplate>({
        data: { messageTemplates, meta: { filters, orderBy, page, limit, total, pages, prev, next, include } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async getFullList({ filters, orderBy, include }: TMessageTemplateFilters): Promise<this> {
    try {
      const q = { where: { ...filters }, orderBy, include: this.getIncludes(include) };
      const [messageTemplates, total] = await this.prisma.$transaction([
        this.prisma.messageTemplate.findMany({ ...q }),
        this.prisma.messageTemplate.count({ where: { ...filters } }),
      ]);
      this.result = statusTMap.get('OK')!<'messageTemplates', MessageTemplate>({
        data: { messageTemplates, meta: { filters, orderBy, total } },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findById({ id, include }: { id: string; include?: Prisma.MessageTemplateInclude }): Promise<this> {
    try {
      const q = { where: { id }, include: this.getIncludes(include) };
      this.messageTemplate = await this.prisma.messageTemplate.findUnique({ ...q });
      this.result = this.messageTemplate
        ? statusTMap.get('OK')!<'messageTemplate', MessageTemplate>({
            data: { messageTemplate: this.messageTemplate, meta: { filters: q.where, include } },
          })
        : statusTMap.get('NotFound')!({
            data: { meta: { filters: q } },
          });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findFirst({ filters, include, orderBy }: TMessageTemplateFilters) {
    try {
      const messageTemplate = await this.prisma.messageTemplate.findFirst({ where: { ...filters }, include, orderBy });
      this.result = messageTemplate
        ? statusTMap.get('OK')!<'messageTemplate', MessageTemplate>({
            data: { messageTemplate, meta: { filters, include, orderBy } },
          })
        : statusTMap.get('NotFound')!({ data: { meta: filters, include, orderBy } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async search(): Promise<this> {
    return this;
  }

  async create(createData: Partial<MessageTemplate>, include?: Prisma.MessageTemplateInclude): Promise<this> {
    const data = this.sanitize<MessageTemplate>(this.fields, createData);
    try {
      this.messageTemplate = await this.prisma.messageTemplate.create({
        data: { ...(data as Prisma.MessageTemplateCreateInput) },
        include: this.getIncludes(include),
      });
      this.result = statusTMap.get('Created')!({ data: { messageTemplate: this.messageTemplate } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async update(updateData: Partial<MessageTemplate>, include?: Prisma.MessageTemplateInclude): Promise<this> {
    const data = this.removeKeys(this.sanitize(this.fields, updateData), ['id']);
    try {
      this.assertMessageTemplateExists();
      const id = this.messageTemplate.id;
      this.messageTemplate = await this.prisma.messageTemplate.update({
        where: { id },
        data,
        include: this.getIncludes(include),
      });
      this.result = statusTMap.get('OK')!<'messageTemplate', MessageTemplate>({
        message: 'App setting updated',
        data: { messageTemplate: this.messageTemplate },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async delete(): Promise<this> {
    try {
      this.assertMessageTemplateExists();
      const id = this.messageTemplate.id;
      const deletedMessageTemplate = await this.prisma.messageTemplate.delete({ where: { id } });
      this.result = statusTMap.get('OK')!({
        data: { meta: { deleted: deletedMessageTemplate, recoverable: this.softDelete } },
      });
      this.unset();
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async batchCreate(): Promise<this> {
    console.log('Not yet implemented');
    return this;
  }

  async batchDelete(): Promise<this> {
    console.log('Not yet implemented');
    return this;
  }

  async batchUpdate(): Promise<this> {
    console.log('Not yet implemented');
    return this;
  }

  private assertMessageTemplateExists(): asserts this is this & { messageTemplate: MessageTemplate } {
    if (!this.messageTemplate || !this.messageTemplate.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  private unset() {
    this.messageTemplate = null;
  }

  private getIncludes(include?: Prisma.MessageTemplateInclude) {
    const countInclude: Prisma.MessageTemplateInclude = {
      _count: { select: { messages: true } },
    };
    return { ...include, ...countInclude };
  }
}
