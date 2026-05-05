import {
  IsString, IsNotEmpty, IsOptional, IsIn, IsNumber, IsUUID, Length, IsBoolean, Min, Max,
} from 'class-validator';

export class CreatePostDto {
  @IsIn(['question', 'answer'])
  postType: 'question' | 'answer';

  @IsOptional()
  @IsUUID()
  parentPostId?: string;

  @IsString()
  @IsNotEmpty()
  rawText: string;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsIn(['yorimichi', 'tamariba'])
  layer?: 'yorimichi' | 'tamariba';

  @IsOptional()
  @IsString()
  @Length(1, 100)
  locationText?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  // v1.7: 写真投稿連動
  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsString()
  storeName?: string;

  @IsOptional()
  @IsString()
  storeAddress?: string;

  @IsOptional()
  @IsString()
  googleMapsUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsBoolean()
  affiliateFlag?: boolean;
}

export class ListPostsQueryDto {
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsIn(['yorimichi', 'tamariba'])
  layer?: 'yorimichi' | 'tamariba';

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;
}
