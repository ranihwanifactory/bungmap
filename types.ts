export interface Store {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  category: 'redbean' | 'shucream' | 'pizza' | 'other';
  priceInfo: string;
  paymentMethods: string[]; // e.g. ['cash', 'card', 'transfer']
  createdAt: number;
}

export interface Review {
  id: string;
  storeId: string;
  nickname: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

// Global declaration for Kakao Maps
declare global {
  interface Window {
    kakao: any;
  }
}
