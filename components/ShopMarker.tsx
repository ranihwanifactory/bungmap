// This component is conceptual for logic separation, 
// actual rendering happens in the parent Map component due to Kakao Maps imperative API.
// However, we define the HTML string generator here.

import { Shop, ShopType } from '../types';

export const getMarkerContent = (shop: Shop, isSelected: boolean) => {
  const mainType = shop.types[0] || ShopType.OTHER;
  
  let emoji = '🐟';
  let fillColor = '#F59E0B'; // amber-500
  
  if (shop.types.includes(ShopType.CREAM)) {
    emoji = '🍦';
    fillColor = '#FACC15'; // yellow-400
  } else if (shop.types.includes(ShopType.ODENG)) {
    // If it has Odeng, we might want to show it, or keep it fish. 
    // If it's ONLY Odeng or Odeng is significant, we could change color.
    // Let's use a reddish color if Odeng is present but keep the fish emoji if Bungeoppang is also there.
    // If only Odeng, maybe change emoji? But the app is "Bungeoppang Map".
    // Let's just change fill color to reddish orange if Odeng is a primary feature.
    // But usually Bungeoppang is main. 
    // Let's just add a condition: if no cream/bean/pizza, but has odeng, make it red.
    const hasBungeoppang = shop.types.some(t => [ShopType.BEAN, ShopType.CREAM, ShopType.PIZZA, ShopType.MINI].includes(t));
    if (!hasBungeoppang) {
        emoji = '🍢';
        fillColor = '#EF4444'; // red-500
    }
  }
  
  if (shop.types.includes(ShopType.PIZZA)) {
     emoji = '🍕';
     fillColor = '#EA580C'; // orange-600
  }

  // Define scale and z-index based on selection
  // origin-bottom ensures scaling happens from the pin tip
  const containerStyle = isSelected 
    ? 'transform scale-110 z-50' 
    : 'transform hover:scale-105 z-10';

  // SVG-based Marker
  // ViewBox: 0 0 46 58
  // The tip of the pin is at (23, 58)
  // We use yAnchor: 1 in the map options (App.tsx), so the bottom of this SVG aligns with the map coordinate.
  
  return `
    <div class="relative group cursor-pointer transition-transform duration-200 origin-bottom ${containerStyle}">
      <svg width="46" height="58" viewBox="0 0 46 58" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 3px rgba(0,0,0,0.15));">
        <!-- Outer White Border/Background -->
        <path fill-rule="evenodd" clip-rule="evenodd" d="M23 58C23 58 46 41.5 46 23C46 10.2975 35.7025 0 23 0C10.2975 0 0 10.2975 0 23C0 41.5 23 58 23 58Z" fill="white"/>
        <!-- Inner Color -->
        <path fill-rule="evenodd" clip-rule="evenodd" d="M23 54C23 54 42 39.5 42 23C42 12.5066 33.4934 4 23 4C12.5066 4 4 12.5066 4 23C4 39.5 23 54 23 54Z" fill="${fillColor}"/>
      </svg>
      
      <!-- Emoji Icon -->
      <div class="absolute top-0 left-0 w-full h-[46px] flex items-center justify-center text-2xl pt-1 pointer-events-none">
        ${emoji}
      </div>

      <!-- Label / Tooltip (Visible when selected) -->
      ${isSelected ? `
        <div class="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-gray-800 text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg border border-gray-100 animate-slide-up flex flex-col items-center">
          ${shop.name}
          <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white transform rotate-45 border-b border-r border-gray-100"></div>
        </div>
      ` : ''}
    </div>
  `;
};