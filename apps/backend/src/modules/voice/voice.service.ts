import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as Minio from 'minio';
import { User } from '../users/user.entity';

@Injectable()
export class VoiceService implements OnModuleInit {
  private readonly logger = new Logger(VoiceService.name);
  private readonly client: Minio.Client;
  private readonly bucket: string;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {
    const endpoint = config.get<string>('minio.endpoint') || 'http://minio:9000';
    const url = new URL(endpoint);
    this.bucket = config.get<string>('minio.bucket') || 'neko-media';
    this.client = new Minio.Client({
      endPoint: url.hostname,
      port: url.port ? parseInt(url.port, 10) : 9000,
      useSSL: url.protocol === 'https:',
      accessKey: config.get<string>('minio.rootUser') || 'minioadmin',
      secretKey: config.get<string>('minio.rootPassword') || 'minioadmin',
    });
  }

  async onModuleInit() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket, 'ap-northeast-1');
        this.logger.log(`MinIO bucket created: ${this.bucket}`);
      }
    } catch (e) {
      this.logger.warn('MinIO bucket init failed (service may not be ready):', e);
    }
  }

  async uploadVoice(
    userId: string,
    buffer: Buffer,
    mimeType: string,
    voiceGender: string,
  ): Promise<string> {
    const ext = mimeType.includes('ogg') ? 'ogg'
      : mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a'
      : 'webm';
    const objectName = `voices/${userId}.${ext}`;

    await this.client.putObject(this.bucket, objectName, buffer, buffer.length, {
      'Content-Type': mimeType,
    });

    const voiceUrl = `${this.bucket}/${objectName}`;
    await this.userRepo.update(userId, {
      voiceUrl,
      voiceGender: voiceGender || 'unknown',
      voiceRegistered: true,
    });

    this.logger.log(`Voice saved for user ${userId}, gender: ${voiceGender}`);
    return voiceUrl;
  }

  async uploadImage(userId: string, buffer: Buffer, mimeType: string): Promise<string> {
    const ext = mimeType.includes('png') ? 'png'
      : mimeType.includes('gif') ? 'gif'
      : 'jpg';
    const objectName = `images/${userId}/${Date.now()}.${ext}`;

    await this.client.putObject(this.bucket, objectName, buffer, buffer.length, {
      'Content-Type': mimeType,
    });

    // プリサインドURLを返す（1年有効）
    return this.client.presignedGetObject(this.bucket, objectName, 365 * 24 * 3600);
  }

  async getPresignedUrl(userId: string): Promise<string | null> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user?.voiceUrl) return null;

    // voiceUrl format: "neko-media/voices/xxx.webm"
    const slashIdx = user.voiceUrl.indexOf('/');
    if (slashIdx === -1) return null;
    const objectName = user.voiceUrl.slice(slashIdx + 1);

    try {
      return await this.client.presignedGetObject(this.bucket, objectName, 3600);
    } catch (e) {
      this.logger.warn(`Presigned URL generation failed for ${userId}:`, e);
      return null;
    }
  }
}
