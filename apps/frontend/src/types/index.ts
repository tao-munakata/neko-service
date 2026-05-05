export interface User {
  id: string;
  nickname: string;
  email: string | null;
  membershipTier: 'guest' | 'member' | 'premium';
  avatarUrl: string | null;
  voiceRegistered?: boolean;
  voiceGender?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Post {
  id: string;
  userId: string;
  postType: 'question' | 'answer';
  parentPostId: string | null;
  rawText: string;
  nekoText: string;
  imageUrl: string | null;
  categoryId: number | null;
  category: Category | null;
  layer: 'yorimichi' | 'tamariba';
  locationText: string | null;
  // v1.7: 写真投稿連動
  storeId: string | null;
  storeName: string | null;
  storeAddress: string | null;
  googleMapsUrl: string | null;
  rating: number | null;
  status: 'active' | 'hidden' | 'deleted';
  createdAt: string;
  user: User;
}

export interface PostsResponse {
  posts: Post[];
  total: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
