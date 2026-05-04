import {
  IsString, IsNotEmpty, IsOptional, IsIn, IsNumber, IsUUID, Length,
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
