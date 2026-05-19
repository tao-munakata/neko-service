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

    const url = 'https://places.googleapis.com/v1/places:searchNearby';
    const body = {
      includedTypes: ['restaurant', 'cafe'],
      maxResultCount: 5,
      languageCode: 'ja',
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 500.0,
        },
      },
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.googleMapsUri,places.types',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        this.logger.warn(`Places API (New) error: ${res.status} / ${errText}`);
        return [];
      }

      const data = await res.json() as PlacesNearbyNewResponse;
      return (data.places ?? []).slice(0, 3).map((p) => ({
        placeId: p.id,
        name: p.displayName?.text ?? '',
        address: p.formattedAddress ?? '',
        distance: null,
        mapsUrl: p.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${p.id}`,
        rating: p.rating ?? null,
        types: p.types ?? [],
      }));
    } catch (err) {
      this.logger.error('Places API (New) fetch error', err);
      return [];
    }
  }

  async findByPlaceId(placeId: string): Promise<PlaceCandidate | null> {
    if (!this.apiKey) return null;

    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    try {
      const res = await fetch(url, {
        headers: {
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,googleMapsUri',
          'Accept-Language': 'ja',
        },
      });
      if (!res.ok) return null;
      const p = await res.json() as PlaceNewDetail;
      return {
        placeId: p.id,
        name: p.displayName?.text ?? '',
        address: p.formattedAddress ?? '',
        distance: null,
        mapsUrl: p.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${p.id}`,
        rating: p.rating ?? null,
        types: [],
      };
    } catch {
      return null;
    }
  }
}

// ── Places API (New) レスポンス型 ───────────────────────────────
interface PlacesNearbyNewResponse {
  places?: PlaceNewItem[];
}

interface PlaceNewItem {
  id: string;
  displayName?: { text: string; languageCode?: string };
  formattedAddress?: string;
  rating?: number;
  googleMapsUri?: string;
  types?: string[];
}

interface PlaceNewDetail {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  googleMapsUri?: string;
}
