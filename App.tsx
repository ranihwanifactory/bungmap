import React, { useEffect, useState, useRef, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { ref, push, onValue, remove, set } from 'firebase/database';
import { auth, db, googleProvider } from './firebase';
import { User, Shop, ShopType, Location, ADMIN_EMAIL } from './types';
import { ShopModal } from './components/ShopModal';
import { Button } from './components/Button';
import { getMarkerContent } from './components/ShopMarker';
import { MapPin, Navigation, Plus, User as UserIcon, LogOut, Trash2, Fish } from 'lucide-react';

declare global {
  interface Window {
    kakao: any;
  }
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [map, setMap] = useState<any>(null);
  const [myLocation, setMyLocation] = useState<Location | null>(null);
  const [mapCenter, setMapCenter] = useState<Location>({ lat: 37.566826, lng: 126.9786567 }); // Default Seoul
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const overlaysRef = useRef<any[]>([]);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isAdmin: firebaseUser.email === ADMIN_EMAIL,
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Load Shops from Firebase
  useEffect(() => {
    const shopsRef = ref(db, 'shops');
    const unsubscribe = onValue(shopsRef, (snapshot) => {
      const data = snapshot.val();
      const shopList: Shop[] = [];
      if (data) {
        Object.keys(data).forEach((key) => {
          shopList.push({
            id: key,
            ...data[key],
          });
        });
      }
      setShops(shopList);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 3. Initialize Kakao Map
  useEffect(() => {
    const script = document.createElement("script");
    // Ensure the key in index.html is correct. This is a fallback check.
    if (!window.kakao) {
      console.warn("Kakao Map SDK not loaded. Check API Key in index.html");
      return;
    }

    window.kakao.maps.load(() => {
      if (!mapContainerRef.current) return;
      
      const options = {
        center: new window.kakao.maps.LatLng(mapCenter.lat, mapCenter.lng),
        level: 4,
      };
      const newMap = new window.kakao.maps.Map(mapContainerRef.current, options);
      setMap(newMap);

      // Listener for center change (to set new shop location)
      window.kakao.maps.event.addListener(newMap, 'center_changed', () => {
        const center = newMap.getCenter();
        setMapCenter({ lat: center.getLat(), lng: center.getLng() });
      });
      
      // Listener to deselect shop on click map
      window.kakao.maps.event.addListener(newMap, 'click', () => {
        setSelectedShopId(null);
      });
    });
  }, []); // Run once on mount

  // 4. Update Markers when shops or selectedShopId changes
  useEffect(() => {
    if (!map || !window.kakao) return;

    // Clear existing markers/overlays
    overlaysRef.current.forEach(overlay => overlay.setMap(null));
    overlaysRef.current = [];

    shops.forEach((shop) => {
      const isSelected = selectedShopId === shop.id;
      const content = getMarkerContent(shop, isSelected);
      const position = new window.kakao.maps.LatLng(shop.location.lat, shop.location.lng);

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: content,
        yAnchor: 1,
        zIndex: isSelected ? 2 : 1
      });

      customOverlay.setMap(map);
      overlaysRef.current.push(customOverlay);

      // Add click event logic to the DOM element created by string
      // Note: Kakao CustomOverlay string content is hard to bind events to directly in React way.
      // We rely on the wrapper div in getMarkerContent having a click handler? 
      // Actually, standard way with string HTML is tricky. 
      // Let's create a DOM element instead of string for better control if possible, 
      // OR simpler: use an invisible marker on top to catch clicks.
      
      // Hack for CustomOverlay click: 
      // The content string needs to be clickable. Since we insert string, we can't easily attach React handler.
      // Workaround: Add a transparent Marker at the same spot to handle clicks.
      const marker = new window.kakao.maps.Marker({
        position: position,
        opacity: 0.01, // Invisible but clickable
        zIndex: 3
      });
      
      marker.setMap(map);
      overlaysRef.current.push(marker); // Store in same ref to clear later

      window.kakao.maps.event.addListener(marker, 'click', () => {
        setSelectedShopId(shop.id);
        map.panTo(position);
      });
    });

  }, [map, shops, selectedShopId]);

  // 5. Geolocation
  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const loc = { lat, lng };
          setMyLocation(loc);
          setMapCenter(loc);
          if (map) {
            const moveLatLon = new window.kakao.maps.LatLng(lat, lng);
            map.panTo(moveLatLon);
          }
        },
        (err) => {
          alert("위치 정보를 가져올 수 없습니다.");
        }
      );
    }
  };

  // 6. Actions
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleAddShop = (data: { name: string; description: string; types: ShopType[]; price: string }) => {
    if (!user) return;
    
    // Get current map center for the new shop
    // If user panned the map, use that.
    const newShopRef = push(ref(db, 'shops'));
    const newShop: Shop = {
      id: newShopRef.key!,
      name: data.name,
      description: data.description,
      location: mapCenter, // Use current center of map
      types: data.types,
      createdAt: Date.now(),
      reporterId: user.uid,
      price: data.price,
      isOpen: true,
    };
    set(newShopRef, newShop);
    // Move map slightly to show the new pin clearly
    setSelectedShopId(newShopRef.key);
  };

  const handleDeleteShop = (shopId: string) => {
    if (window.confirm("정말 이 가게를 삭제하시겠습니까?")) {
      remove(ref(db, `shops/${shopId}`));
      setSelectedShopId(null);
    }
  };

  // Get Selected Shop Details
  const selectedShop = shops.find(s => s.id === selectedShopId);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-orange-50">
      
      {/* Map Container */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* Check for Kakao Map Error */}
      {!window.kakao && (
        <div className="absolute inset-0 flex items-center justify-center bg-orange-100 z-50 text-center p-4">
          <div>
            <h1 className="text-2xl font-bold text-red-500 mb-2">지도 로딩 실패</h1>
            <p className="text-gray-700">index.html 파일에서 Kakao Map API Key를 설정해주세요.</p>
          </div>
        </div>
      )}

      {/* Top Navigation / Auth */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pointer-events-none">
        <div className="flex justify-between items-start max-w-2xl mx-auto pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-orange-100">
            <h1 className="text-xl font-bold text-amber-600 font-hand flex items-center gap-2">
              <span className="text-2xl">🐟</span> 붕어빵 대동여지도
            </h1>
          </div>
          
          <div className="flex gap-2">
            {!user ? (
              <Button onClick={handleLogin} size="sm" className="bg-gray-900 text-white shadow-lg">
                <UserIcon size={16} /> 로그인
              </Button>
            ) : (
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-orange-100">
                <img src={user.photoURL || 'https://picsum.photos/40/40'} alt="Profile" className="w-8 h-8 rounded-full border border-gray-200" />
                <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-500 transition-colors rounded-full hover:bg-red-50">
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute right-4 bottom-24 sm:bottom-10 z-20 flex flex-col gap-3">
        <button 
          onClick={handleMyLocation}
          className="bg-white p-3 rounded-full shadow-lg text-gray-600 hover:text-amber-600 active:scale-90 transition-all border border-gray-100"
          aria-label="Find my location"
        >
          <Navigation size={24} />
        </button>

        {user && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-amber-500 p-4 rounded-full shadow-lg shadow-amber-500/30 text-white active:scale-90 transition-all hover:bg-amber-600 animate-bounce-slight"
            aria-label="Add Shop"
          >
            <Plus size={28} strokeWidth={3} />
          </button>
        )}
      </div>

      {/* Center Marker Indicator (when moving map to add) */}
      {isModalOpen && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
           {/* This is simulated visually, the actual modal opens on top */}
        </div>
      )}

      {/* Bottom Sheet / Shop Details */}
      {selectedShop && (
        <div className="absolute bottom-0 left-0 right-0 z-30 p-4 animate-slide-up">
          <div className="bg-white w-full max-w-2xl mx-auto rounded-3xl p-6 shadow-2xl border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-400"></div>
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 font-hand flex items-center gap-2">
                  {selectedShop.name}
                  {selectedShop.types.includes(ShopType.CREAM) && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-sans">슈크림</span>}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{selectedShop.description || "상세 설명이 없습니다."}</p>
              </div>
              <button onClick={() => setSelectedShopId(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-orange-50 p-3 rounded-xl">
                <p className="text-xs text-orange-500 font-semibold mb-1">판매 메뉴</p>
                <div className="flex flex-wrap gap-1">
                  {selectedShop.types.map(t => (
                    <span key={t} className="text-sm text-gray-700 bg-white px-2 py-0.5 rounded-md shadow-sm border border-orange-100">{t}</span>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-xs text-gray-500 font-semibold mb-1">가격</p>
                <p className="text-sm text-gray-700 font-medium">{selectedShop.price || "가격 정보 없음"}</p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-2 border-t border-gray-100 pt-4">
              <span className="text-xs text-gray-400">
                제보자: {selectedShop.reporterId.slice(0, 5)}***
              </span>
              
              {user && (user.isAdmin || user.uid === selectedShop.reporterId) && (
                <button 
                  onClick={() => handleDeleteShop(selectedShop.id)}
                  className="flex items-center gap-1 text-red-500 text-sm hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 size={14} /> 삭제하기
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Instructions when no shop selected */}
      {!selectedShop && !isLoading && (
         <div className="absolute bottom-8 left-0 right-0 z-10 pointer-events-none text-center px-4">
           <span className="inline-block bg-white/80 backdrop-blur px-4 py-2 rounded-full text-sm font-medium text-amber-800 shadow-sm border border-white/50 animate-pulse">
             {user ? "지도를 움직여 + 버튼으로 붕어빵을 제보해주세요!" : "로그인하고 숨겨진 붕어빵 맛집을 공유해보세요!"}
           </span>
         </div>
      )}

      <ShopModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddShop}
        location={mapCenter}
      />
    </div>
  );
};

export default App;