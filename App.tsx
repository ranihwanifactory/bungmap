import React, { useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { ref, push, onValue, remove, set, update } from 'firebase/database';
import { auth, db, googleProvider } from './firebase';
import { User, Shop, ShopType, Location, ADMIN_EMAIL } from './types';
import { ShopModal } from './components/ShopModal';
import { Button } from './components/Button';
import { getMarkerContent } from './components/ShopMarker';
import { Navigation, Plus, User as UserIcon, LogOut, Trash2, MapPin, Check, X, Database, Edit3 } from 'lucide-react';

declare global {
  interface Window {
    kakao: any;
  }
}

// Sample Data for seeding
const SAMPLE_SHOPS: Partial<Shop>[] = [
  { name: '강남역 붕어빵', description: '9번 출구 앞, 팥이 꽉 찼어요!', location: { lat: 37.498095, lng: 127.027610 }, types: [ShopType.BEAN, ShopType.CREAM], price: '2개 1000원' },
  { name: '부산 해운대 잉어빵', description: '바닷가 앞에서 먹는 맛', location: { lat: 35.158698, lng: 129.160384 }, types: [ShopType.PIZZA, ShopType.BEAN], price: '3개 2000원' },
  { name: '전주 한옥마을 붕어', description: '전통의 맛, 줄 서서 먹어요.', location: { lat: 35.814708, lng: 127.152632 }, types: [ShopType.BEAN], price: '1개 1000원' },
  { name: '제주 공항 붕어빵', description: '도착하자마자 하나!', location: { lat: 33.510413, lng: 126.491353 }, types: [ShopType.CREAM, ShopType.MINI], price: '5개 3000원' },
  { name: '홍대 입구 슈크림', description: '늦게 가면 없어요', location: { lat: 37.556263, lng: 126.922960 }, types: [ShopType.CREAM], price: '2개 1500원' },
  { name: '대전 성심당 근처', description: '튀김소보로 말고 붕어빵도 있어요', location: { lat: 36.327666, lng: 127.427329 }, types: [ShopType.BEAN, ShopType.PIZZA], price: '3개 2000원' },
  { name: '대구 동성로 미니붕어', description: '쇼핑하다 출출할 때 최고', location: { lat: 35.868615, lng: 128.598687 }, types: [ShopType.MINI], price: '10개 3000원' },
  { name: '광주 펭귄마을 붕어', description: '귀여운 모양의 붕어빵', location: { lat: 35.139686, lng: 126.913543 }, types: [ShopType.BEAN, ShopType.CREAM], price: '3개 2000원' }
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [map, setMap] = useState<any>(null);
  const [myLocation, setMyLocation] = useState<Location | null>(null);
  const [mapCenter, setMapCenter] = useState<Location>({ lat: 37.566826, lng: 126.9786567 }); // Default Seoul
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false); // Mode for pinning location
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [editingShop, setEditingShop] = useState<Shop | null>(null); // Shop currently being edited
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialBoundsSet, setIsInitialBoundsSet] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const overlaysRef = useRef<any[]>([]);
  const myLocationOverlayRef = useRef<any>(null);

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
    if (!window.kakao) return;

    window.kakao.maps.load(() => {
      if (!mapContainerRef.current) return;
      
      const options = {
        center: new window.kakao.maps.LatLng(mapCenter.lat, mapCenter.lng),
        level: 4,
      };
      const newMap = new window.kakao.maps.Map(mapContainerRef.current, options);
      setMap(newMap);

      window.kakao.maps.event.addListener(newMap, 'center_changed', () => {
        const center = newMap.getCenter();
        setMapCenter({ lat: center.getLat(), lng: center.getLng() });
      });
      
      window.kakao.maps.event.addListener(newMap, 'click', () => {
        if (!isSelectingLocation) {
          setSelectedShopId(null);
        }
      });
    });
  }, []); 

  // 4. Update Shop Markers
  useEffect(() => {
    if (!map || !window.kakao) return;

    // Clear existing markers
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
        zIndex: isSelected ? 20 : 10
      });

      customOverlay.setMap(map);
      overlaysRef.current.push(customOverlay);

      // Invisible Click Target
      const marker = new window.kakao.maps.Marker({
        position: position,
        opacity: 0.01,
        zIndex: 15
      });
      
      marker.setMap(map);
      overlaysRef.current.push(marker);

      window.kakao.maps.event.addListener(marker, 'click', () => {
        if (!isSelectingLocation) {
          setSelectedShopId(shop.id);
          map.panTo(position);
        }
      });
    });

  }, [map, shops, selectedShopId, isSelectingLocation]);

  // 5. Update My Location Marker
  useEffect(() => {
    if (!map || !window.kakao || !myLocation) return;

    const position = new window.kakao.maps.LatLng(myLocation.lat, myLocation.lng);
    
    // Pulse Effect Marker for My Location
    const content = `
      <div class="relative flex items-center justify-center w-12 h-12">
        <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg z-20 relative"></div>
        <div class="absolute top-0 left-0 w-full h-full bg-blue-400 rounded-full opacity-40 animate-ping"></div>
      </div>
    `;

    if (myLocationOverlayRef.current) {
      myLocationOverlayRef.current.setPosition(position);
      myLocationOverlayRef.current.setMap(map);
    } else {
      myLocationOverlayRef.current = new window.kakao.maps.CustomOverlay({
        map: map,
        position: position,
        content: content,
        yAnchor: 0.5,
        zIndex: 5
      });
    }

  }, [map, myLocation]);

  // 6. Set Initial Map Bounds to show all shops
  useEffect(() => {
    if (map && window.kakao && shops.length > 0 && !isInitialBoundsSet) {
      const bounds = new window.kakao.maps.LatLngBounds();
      shops.forEach((shop) => {
        bounds.extend(new window.kakao.maps.LatLng(shop.location.lat, shop.location.lng));
      });
      map.setBounds(bounds);
      setIsInitialBoundsSet(true);
    }
  }, [map, shops, isInitialBoundsSet]);

  // Actions
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
            map.setLevel(4);
          }
        },
        (err) => {
          alert("위치 정보를 가져올 수 없습니다.");
        }
      );
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => signOut(auth);

  // Start Location Selection Mode
  const startAddShopProcess = () => {
    setIsSelectingLocation(true);
    setSelectedShopId(null);
    setEditingShop(null); // Ensure we are not in edit mode
  };

  // Confirm Location and Open Modal
  const handleConfirmLocation = () => {
    setIsSelectingLocation(false);
    setIsModalOpen(true);
  };

  const handleCancelLocation = () => {
    setIsSelectingLocation(false);
    setEditingShop(null); // Clear editing state if cancelled
  };

  const handleShopSubmit = (data: { name: string; description: string; types: ShopType[]; price: string }) => {
    if (!user) return;
    
    if (editingShop) {
      // UPDATE EXISTING
      const shopRef = ref(db, `shops/${editingShop.id}`);
      update(shopRef, {
        name: data.name,
        description: data.description,
        types: data.types,
        price: data.price,
        location: mapCenter, // Update location to current center
      });
      alert("정보가 수정되었습니다.");
      setEditingShop(null);
    } else {
      // CREATE NEW
      const newShopRef = push(ref(db, 'shops'));
      const newShop: Shop = {
        id: newShopRef.key!,
        name: data.name,
        description: data.description,
        location: mapCenter, // Use current center (which user confirmed)
        types: data.types,
        createdAt: Date.now(),
        reporterId: user.uid,
        price: data.price,
        isOpen: true,
      };
      set(newShopRef, newShop);
      setSelectedShopId(newShopRef.key);
    }
  };

  const handleEditShop = () => {
    const shopToEdit = shops.find(s => s.id === selectedShopId);
    if (!shopToEdit) return;
    
    setEditingShop(shopToEdit);
    
    // Pan map to current shop location for editing
    setMapCenter(shopToEdit.location);
    if (map && window.kakao) {
         const moveLatLon = new window.kakao.maps.LatLng(shopToEdit.location.lat, shopToEdit.location.lng);
         map.panTo(moveLatLon);
    }

    // Enter location selection mode for editing
    setIsSelectingLocation(true);
    setSelectedShopId(null);
  };

  const handleDeleteShop = (shopId: string) => {
    if (window.confirm("정말 이 가게를 삭제하시겠습니까?")) {
      remove(ref(db, `shops/${shopId}`));
      setSelectedShopId(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingShop(null); // Reset edit state when closing
  };

  // Seed Data Function (Admin Only)
  const handleSeedData = () => {
    if (!window.confirm("샘플 데이터를 지도에 추가하시겠습니까?")) return;
    
    SAMPLE_SHOPS.forEach(shop => {
      const newShopRef = push(ref(db, 'shops'));
      set(newShopRef, {
        ...shop,
        id: newShopRef.key!,
        createdAt: Date.now(),
        reporterId: user?.uid || 'admin',
        isOpen: true
      });
    });
    alert("전국 붕어빵 맛집 데이터가 로드되었습니다!");
  };

  const selectedShop = shops.find(s => s.id === selectedShopId);

  // Permission Logic
  const canEdit = selectedShop && user && (user.isAdmin || user.uid === selectedShop.reporterId);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-orange-50">
      
      {/* Map Container */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* Center Fixed Pin (Visible only when selecting location) */}
      {isSelectingLocation && (
        <div className="absolute top-1/2 left-1/2 z-10 pointer-events-none transform -translate-x-1/2 -translate-y-full flex flex-col items-center">
           {/* Pin Image */}
           <MapPin size={48} className="text-amber-600 fill-amber-500 drop-shadow-2xl animate-bounce-slight" strokeWidth={2} />
           {/* Shadow Point on the ground (Screen Center) */}
           <div className="absolute -bottom-1 w-2 h-1 bg-black/30 rounded-full blur-[1px]"></div>
        </div>
      )}

      {/* Check for Kakao Map Error */}
      {!window.kakao && (
        <div className="absolute inset-0 flex items-center justify-center bg-orange-100 z-50 text-center p-4">
          <p className="text-gray-700">지도를 불러오는 중입니다...</p>
        </div>
      )}

      {/* Top Navigation / Auth */}
      <div className={`absolute top-0 left-0 right-0 z-20 p-4 transition-transform duration-300 ${isSelectingLocation ? '-translate-y-full' : 'translate-y-0'}`}>
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
                
                {/* Seed Data Button (Admin Only) */}
                {user.isAdmin && (
                  <button onClick={handleSeedData} className="p-2 text-amber-600 hover:bg-amber-50 rounded-full transition-colors" title="샘플 데이터 로드">
                    <Database size={16} />
                  </button>
                )}

                <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-500 transition-colors rounded-full hover:bg-red-50">
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Location Selection Controls */}
      {isSelectingLocation ? (
        <div className="absolute bottom-10 left-0 right-0 z-30 flex flex-col items-center gap-4 px-4 animate-slide-up">
           <div className="bg-gray-800/80 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
             {editingShop ? "가게의 새로운 위치를 선택해주세요" : "지도를 움직여 가게 위치를 맞춰주세요"}
           </div>
           <div className="flex gap-3 w-full max-w-sm justify-center">
             <Button onClick={handleCancelLocation} variant="secondary" className="shadow-lg">
               <X size={20} /> 취소
             </Button>
             <Button onClick={handleConfirmLocation} variant="primary" className="shadow-lg flex-1">
               <Check size={20} /> {editingShop ? "위치 수정완료" : "이 위치에 등록하기"}
             </Button>
           </div>
        </div>
      ) : (
        /* Standard Floating Action Buttons */
        <div className="absolute right-4 bottom-24 sm:bottom-10 z-20 flex flex-col gap-3">
          <button 
            onClick={handleMyLocation}
            className="bg-white p-3 rounded-full shadow-lg text-gray-600 hover:text-amber-600 active:scale-90 transition-all border border-gray-100"
            aria-label="Find my location"
          >
            <Navigation size={24} className={myLocation ? "fill-blue-100 text-blue-500" : ""} />
          </button>

          {user && (
            <button 
              onClick={startAddShopProcess}
              className="bg-amber-500 p-4 rounded-full shadow-lg shadow-amber-500/30 text-white active:scale-90 transition-all hover:bg-amber-600 animate-bounce-slight"
              aria-label="Add Shop"
            >
              <Plus size={28} strokeWidth={3} />
            </button>
          )}
        </div>
      )}

      {/* Shop Details Modal (Bottom Sheet) */}
      {!isSelectingLocation && selectedShop && (
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
              
              {canEdit && (
                <div className="flex gap-2">
                   <button 
                    onClick={handleEditShop}
                    className="flex items-center gap-1 text-blue-500 text-sm hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Edit3 size={14} /> 수정
                  </button>
                  <button 
                    onClick={() => handleDeleteShop(selectedShop.id)}
                    className="flex items-center gap-1 text-red-500 text-sm hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} /> 삭제
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Instructions when no shop selected */}
      {!isSelectingLocation && !selectedShop && !isLoading && (
         <div className="absolute bottom-8 left-0 right-0 z-10 pointer-events-none text-center px-4">
           <span className="inline-block bg-white/80 backdrop-blur px-4 py-2 rounded-full text-sm font-medium text-amber-800 shadow-sm border border-white/50 animate-pulse">
             {user ? "지도를 움직여 + 버튼으로 붕어빵을 제보해주세요!" : "로그인하고 숨겨진 붕어빵 맛집을 공유해보세요!"}
           </span>
         </div>
      )}

      <ShopModal 
        isOpen={isModalOpen} 
        onClose={handleModalClose}
        onSubmit={handleShopSubmit}
        location={mapCenter}
        initialData={editingShop ? {
          name: editingShop.name,
          description: editingShop.description,
          types: editingShop.types,
          price: editingShop.price || ''
        } : null}
      />
    </div>
  );
};

export default App;