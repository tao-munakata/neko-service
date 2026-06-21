export type LoginType = 'registration_init' | 'device_login' | 'email_login';

export interface DeviceIdentity {
  deviceId: string | null;
  userAgent: string;
  screenResolution?: string | null;
  timezone?: string | null;
  language?: string | null;
}

export interface DeviceLogEntry {
  id: string;
  timestamp: string;
  type: LoginType;
  ip: string;
  identity: DeviceIdentity;
}
