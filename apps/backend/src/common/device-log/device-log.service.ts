import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DeviceLogEntry, DeviceIdentity, LoginType } from './device-log.types';

const LOG_EXPIRY = new Date('2026-07-22T00:00:00Z');
const MAX_ENTRIES = 200;

@Injectable()
export class DeviceLogService {
  private readonly entries: DeviceLogEntry[] = [];

  isActive(): boolean {
    return new Date() < LOG_EXPIRY;
  }

  record(type: LoginType, ip: string, identity: DeviceIdentity): void {
    if (!this.isActive()) return;
    this.entries.unshift({
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      ip,
      identity,
    });
    if (this.entries.length > MAX_ENTRIES) this.entries.length = MAX_ENTRIES;
  }

  getAll(): DeviceLogEntry[] {
    return this.entries;
  }
}
