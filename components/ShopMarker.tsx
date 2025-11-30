// This component is conceptual for logic separation, 
// actual rendering happens in the parent Map component due to Kakao Maps imperative API.
// However, we define the HTML string generator here.

import { Shop, ShopType } from '../types';

export const getMarkerContent = (shop: Shop, isSelected: boolean) => {
  const mainType = shop.types[0] || ShopType.OTHER;
  
  let emoji = '🐟';
  let colorClass = 'bg-amber-500';

  if (shop.types.includes(ShopType.CREAM)) {
    emoji = '🍦';
    colorClass = 'bg-yellow-400';
  } else if (shop.types.includes(ShopType.PIZZA)) {
    emoji = '🍕';
    colorClass = 'bg-orange-600';
  }

  const selectedStyle = isSelected ? 'transform scale-125 border-4 border-white shadow-xl z-50' : 'shadow-md hover:scale-110';

  // We return a string of HTML because Kakao Maps CustomOverlay takes content as string or DOM element
  return `
    <div class="relative group cursor-pointer transition-all duration-300 ${selectedStyle}" style="margin-bottom: 25px;">
      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-amber-500"></div>
      <div class="w-10 h-10 ${colorClass} rounded-full flex items-center justify-center text-xl border-2 border-white">
        ${emoji}
      </div>
      ${isSelected ? `<div class="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded-md opacity-90">${shop.name}</div>` : ''}
    </div>
  `;
};