import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PlaceCandidate {
  placeId: string;
  name: string;
  address: string;
  distance: number | null;
  mapsUrl: string;
  rating: number | null;
  types: string[];
}

@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = config.get<string>('googlePlaces.apiKey') || '';
  }

  async findNearby(lat: number, lng: number): Promise<PlaceCandidate[]> {
    if (!this.apiKey) {
      this.logger.warn('Google Places APIキーが未設定にゃん');
      return [];
    }

    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    url.searchParams.set('location', `${lat},${lng}`);
    url.searchParams.set('radius', '100');          // 100m以内
    url.searchParams.set('type', 'restaurant');
    url.searchParams.set('language', 'ja');
    url.searchParams.set('key', this.apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Places API error: ${res.status}`);
    const data = await res.json() as PlacesNearbyResponse;

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      this.logger.warn(`Places API status: ${data.status}`);
      return [];
    }

    return (data.results ?? []).slice(0, 3).map((p) => ({
      placeId: p.place_id,
      name: p.name,
      address: p.vicinity,
      distance: null,
      mapsUrl: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
      rating: p.rating ?? null,
      types: p.types ?? [],
    }));
  }

  async findByPlaceId(placeId: string): Promise<PlaceCandidate | null> {
    if (!this.apiKey) return null;

    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('fields', 'place_id,name,formatted_address,rating,url');
    url.searchParams.set('language', 'ja');
    url.searchParams.set('key', this.apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = await res.json() as PlaceDetailsResponse;
    if (data.status !== 'OK' || !data.result) return null;

    const p = data.result;
    return {
      placeId: p.place_id,
      name: p.name,
      address: p.formatted_address,
      distance: null,
      mapsUrl: p.url ?? `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
      rating: p.rating ?? null,
      types: [],
    };
  }
}

// ── Places API レスポンス型（必要フィールドのみ） ───────────────
interface PlacesNearbyResponse {
  status: string;
  results: Array<{
    place_id: string;
    name: string;
    vicinity: string;
    rating?: number;
    types?: string[];
  }>;
}

interface PlaceDetailsResponse {
  status: string;
  result?: {
    place_id: string;
    name: string;
    formatted_address: string;
    rating?: number;
    url?: string;
  };
}
