import { Prisma, DeviceCommand } from '@prisma/client';
import { PostgresDBService, TPagination } from './common.pg';
import { CustomErrorByType, statusTMap } from '@neoncoder/typed-service-response';

export type TDeviceCommandFilters = {
  filters?: Prisma.DeviceCommandWhereInput;
  orderBy?: Prisma.DeviceCommandOrderByWithRelationInput | Prisma.DeviceCommandOrderByWithRelationInput[];
  exclude?: Array<keyof DeviceCommand>;
};

export class DeviceCommandPostgresService extends PostgresDBService<'deviceCommands' | 'deviceCommand', DeviceCommand> {
  deviceCommand: DeviceCommand | null;
  fields = [
    'id',
    'title',
    'command',
    'commandType',
    'description',
    'parameters',
    'queryReturn',
    'defaultValue',
    'defaultUnit',
    'range',
  ];

  constructor({
    softDelete = false,
    deviceCommand = undefined,
  }: {
    softDelete?: boolean;
    deviceCommand?: DeviceCommand;
  }) {
    super({ softDelete });
    this.deviceCommand = deviceCommand ?? null;
  }

  async getList({ page = 1, limit = 25, filters, orderBy }: TDeviceCommandFilters & TPagination) {
    try {
      const q = { take: limit, skip: (page - 1) * limit, where: { ...filters }, orderBy };
      const [deviceCommands, total] = await this.prisma.$transaction([
        this.prisma.deviceCommand.findMany({ ...q }),
        this.prisma.deviceCommand.count({ where: { ...filters } }),
      ]);
      const { pages, prev, next } = this.paginate(total, limit, page);
      this.result = statusTMap.get('OK')!<'deviceCommands', DeviceCommand>({
        data: { deviceCommands, meta: { filters, orderBy, page, limit, total, pages, prev, next } },
        message: 'Device Commands',
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async getFullList({ filters, orderBy }: TDeviceCommandFilters): Promise<this> {
    try {
      const q = { where: { ...filters }, orderBy };
      const [deviceCommands, total] = await this.prisma.$transaction([
        this.prisma.deviceCommand.findMany({ ...q }),
        this.prisma.deviceCommand.count({ where: { ...filters } }),
      ]);
      this.result = statusTMap.get('OK')!<'deviceCommands', DeviceCommand>({
        data: { deviceCommands, meta: { filters, orderBy, total } },
        message: 'Device Commands',
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findById({ id }: { id: string }): Promise<this> {
    try {
      const q = { where: { id } };
      this.deviceCommand = await this.prisma.deviceCommand.findUnique({ ...q });
      this.result = this.deviceCommand
        ? statusTMap.get('OK')!<'deviceCommand', DeviceCommand>({
            data: { deviceCommand: this.deviceCommand, meta: { filters: q } },
          })
        : statusTMap.get('NotFound')!({
            data: { meta: { filters: q } },
          });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async findFirst({ filters, orderBy }: TDeviceCommandFilters) {
    try {
      const deviceCommand = await this.prisma.deviceCommand.findFirst({ where: { ...filters }, orderBy });
      this.result = deviceCommand
        ? statusTMap.get('OK')!<'deviceCommand', DeviceCommand>({ data: { deviceCommand, meta: { filters, orderBy } } })
        : statusTMap.get('NotFound')!({ data: { meta: filters, orderBy } });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async search(): Promise<this> {
    return this;
  }

  async create(createData: Partial<DeviceCommand>): Promise<this> {
    const data = this.sanitize<DeviceCommand>(this.fields, createData);
    try {
      this.deviceCommand = await this.prisma.deviceCommand.create({
        data: { ...(data as Prisma.DeviceCommandCreateInput) },
      });
      this.result = statusTMap.get('Created')!({
        data: { deviceCommand: this.deviceCommand },
        message: `Device Command Added`,
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async update(updateData: Partial<DeviceCommand>): Promise<this> {
    const data = this.removeKeys(this.sanitize(this.fields, updateData), ['id']);
    try {
      this.assertDeviceCommandExists();
      const id = this.deviceCommand.id;
      this.deviceCommand = await this.prisma.deviceCommand.update({ where: { id }, data });
      this.result = statusTMap.get('OK')!<'deviceCommand', DeviceCommand>({
        message: 'Device Command updated',
        data: { deviceCommand: this.deviceCommand },
      });
    } catch (error: any) {
      this.formatError(error);
    }
    return this;
  }

  async delete(): Promise<this> {
    try {
      this.assertDeviceCommandExists();
      const id = this.deviceCommand.id;
      const deletedDeviceCommand = await this.prisma.deviceCommand.delete({ where: { id } });
      this.result = statusTMap.get('OK')!({
        data: { meta: { deleted: deletedDeviceCommand, recoverable: this.softDelete } },
        message: 'Device Command Deleted',
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

  assertDeviceCommandExists(): asserts this is this & { deviceCommand: DeviceCommand } {
    if (!this.deviceCommand || !this.deviceCommand.id) {
      throw new CustomErrorByType({ type: 'ExpectationFailed' });
    }
  }

  unset() {
    this.deviceCommand = null;
  }
}
