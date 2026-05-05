import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

export type MembershipTier = 'guest' | 'member' | 'premium';
export type AuthMethod = 'device' | 'email';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  nickname: string;

  @Column({ name: 'cat_character', type: 'varchar', length: 100, nullable: true })
  catCharacter: string | null;

  @Column({ name: 'phone_number', type: 'varchar', length: 20, nullable: true })
  phoneNumber: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  email: string | null;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'membership_tier', type: 'varchar', default: 'member' })
  membershipTier: MembershipTier;

  @Column({ type: 'text', nullable: true, select: false })
  password: string | null;

  @Column({ name: 'auth_method', type: 'varchar', default: 'device' })
  authMethod: AuthMethod;

  @Column({ name: 'device_fingerprint', type: 'varchar', length: 255, nullable: true, unique: true })
  deviceFingerprint: string | null;

  @Column({ name: 'voice_registered', type: 'boolean', default: false })
  voiceRegistered: boolean;

  @Column({ name: 'location_lat', type: 'decimal', precision: 10, scale: 8, nullable: true })
  locationLat: number | null;

  @Column({ name: 'location_lng', type: 'decimal', precision: 11, scale: 8, nullable: true })
  locationLng: number | null;

  @Column({ name: 'maps_consent', type: 'boolean', default: false })
  mapsConsent: boolean;

  @Column({ name: 'voice_url', type: 'text', nullable: true })
  voiceUrl: string | null;

  @Column({ name: 'voice_gender', type: 'varchar', length: 20, default: 'unknown' })
  voiceGender: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'last_active_at', type: 'timestamptz', default: () => 'NOW()' })
  lastActiveAt: Date;
}
