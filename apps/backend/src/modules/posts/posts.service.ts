import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Post } from './post.entity';
import { NekoAiService } from '../ai/neko-ai.service';
import { CreatePostDto } from './dto/post.dto';

@Injectable()
export class PostsService {
  private readonly minioEndpoint: string;
  private readonly minioPublicUrl: string;

  constructor(
    @InjectRepository(Post) private readonly repo: Repository<Post>,
    private readonly nekoAi: NekoAiService,
    private readonly config: ConfigService,
  ) {
    this.minioEndpoint = config.get<string>('minio.endpoint') || 'http://minio:9000';
    this.minioPublicUrl = config.get<string>('minio.publicUrl') || '';
  }

  private toPublicUrl(url: string | null): string | null {
    if (!url || !this.minioPublicUrl) return url;
    return url.replace(this.minioEndpoint, this.minioPublicUrl);
  }

  async create(userId: string, dto: CreatePostDto): Promise<Post> {
    const nekoText = await this.nekoAi.convertToNekoText(dto.rawText);
    const post = this.repo.create({
      userId,
      postType: dto.postType,
      parentPostId: dto.parentPostId ?? null,
      rawText: dto.rawText,
      nekoText,
      categoryId: dto.categoryId ?? null,
      layer: dto.layer ?? 'yorimichi',
      locationText: dto.locationText ?? null,
      imageUrl: dto.imageUrl ?? null,
      storeId: dto.storeId ?? null,
      storeName: dto.storeName ?? null,
      storeAddress: dto.storeAddress ?? null,
      googleMapsUrl: dto.googleMapsUrl ?? null,
      rating: dto.rating ?? null,
      affiliateFlag: dto.affiliateFlag ?? false,
    });
    return this.repo.save(post);
  }

  async findAll(query: {
    categoryId?: number;
    layer?: string;
    location?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: FindManyOptions<Post>['where'] = { status: 'active' };
    if (query.categoryId) Object.assign(where, { categoryId: query.categoryId });
    if (query.layer) Object.assign(where, { layer: query.layer });

    const [posts, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: Math.min(query.limit ?? 20, 100),
      skip: query.offset ?? 0,
      relations: ['user', 'category'],
    });
    posts.forEach(p => { p.imageUrl = this.toPublicUrl(p.imageUrl); });
    return { posts, total };
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.repo.findOne({
      where: { id, status: 'active' },
      relations: ['user', 'category'],
    });
    if (!post) throw new NotFoundException('投稿が見つからないにゃん');
    post.imageUrl = this.toPublicUrl(post.imageUrl);
    return post;
  }

  async findAnswers(parentPostId: string) {
    return this.repo.find({
      where: { parentPostId, status: 'active' },
      order: { createdAt: 'ASC' },
      relations: ['user'],
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const post = await this.repo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('投稿が見つからないにゃん');
    if (post.userId !== userId) throw new ForbiddenException('この操作はできないにゃん');
    await this.repo.update(id, { status: 'deleted' });
  }
}
