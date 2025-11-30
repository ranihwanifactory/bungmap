export interface Location {
  lat: number;
  lng: number;
}

export enum ShopType {
  BEAN = '팥',
  CREAM = '슈크림',
  PIZZA = '피자/치즈',
  MINI = '미니',
  OTHER = '기타'
}

export interface Shop {
  id: string;
  name: string;
  description: string;
  location: Location;
  types: ShopType[];
  createdAt: number;
  reporterId: string; // User ID who reported
  price?: string;
  isOpen?: boolean;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin: boolean;
}

export const ADMIN_EMAIL = "acehwan69@gmail.com";