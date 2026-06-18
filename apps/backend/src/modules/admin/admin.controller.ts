import {
  Controller, Get, Delete, Param, Headers, ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Controller('admin')
export class AdminController {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  private authorize(secret: string | undefined) {
    const expected = this.config.get<string>('adminSecret');
    if (!expected || secret !== expected) {
      throw new ForbiddenException('Invalid admin secret');
    }
  }

  @Get('devices')
  async listDevices(@Headers('x-admin-secret') secret: string | undefined) {
    this.authorize(secret);
    const users = await this.userRepo.find({
      select: ['id', 'nickname', 'catCharacter', 'deviceFingerprint', 'authMethod', 'createdAt', 'lastActiveAt'],
      order: { createdAt: 'DESC' },
    });
    return users;
  }

  @Delete('devices/:id')
  async deleteDevice(
    @Param('id') id: string,
    @Headers('x-admin-secret') secret: string | undefined,
  ) {
    this.authorize(secret);
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) return { deleted: false, message: 'User not found' };
    await this.userRepo.delete(id);
    return { deleted: true, id };
  }
}
