import { Global, Module } from '@nestjs/common';
import { DeviceLogService } from './device-log.service';

@Global()
@Module({
  providers: [DeviceLogService],
  exports: [DeviceLogService],
})
export class DeviceLogModule {}
