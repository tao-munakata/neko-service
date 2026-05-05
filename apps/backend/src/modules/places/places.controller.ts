import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlacesService } from './places.service';

class NearbyDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

class PlaceByIdDto {
  @IsString()
  placeId: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;
}

@Controller('places')
@UseGuards(JwtAuthGuard)
export class PlacesController {
  constructor(private readonly places: PlacesService) {}

  /** GPS座標から近隣飲食店候補を取得（最大3件） */
  @Post('nearby')
  async nearby(@Body() dto: NearbyDto) {
    const candidates = await this.places.findNearby(dto.lat, dto.lng);
    return { candidates };
  }

  /** Place IDから店舗詳細を取得 */
  @Post('detail')
  async detail(@Body() dto: PlaceByIdDto) {
    const place = await this.places.findByPlaceId(dto.placeId);
    return { place };
  }
}
