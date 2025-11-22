import React, { useState, useEffect } from 'react';
import { KakaoMap } from './components/KakaoMap';
import { Sidebar } from './components/Sidebar';
import { StoreForm } from './components/StoreForm';
import { StoreDetail } from './components/StoreDetail';
import { AuthForm } from './components/AuthForm';
import { Store, Review, LatLng } from './types';
import { getStores, addStore, getReviews, addReview, updateStore, deleteStore, updateReview, deleteReview } from './services/firebaseService';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Plus, Fish, LogOut, AlertTriangle, Download, List, Map as MapIcon } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [stores, setStores] = useState<Store[]>([]);
  
  // UI States
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [isEditingStore, setIsEditingStore] = useState(false);
  const [isMobileListOpen, setIsMobileListOpen] = useState(false); // New state for mobile list toggle
  
  // Location States
  const [newStoreLocation, setNewStoreLocation] = useState<LatLng | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLng>({ lat: 37.5665, lng: 126.9780 });
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Permission Error State
  const [permissionError, setPermissionError] = useState(false);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // PWA Install Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      // Check if app is not already installed (standalone)
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setDeferredPrompt(e);
        setShowInstallModal(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setDeferredPrompt(null);
      setShowInstallModal(false);
    }
  };

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Initial Data Load
  useEffect(() => {
    if (!user) return;

    const fetchStores = async () => {
      try {
        const data = await getStores();
        setStores(data);
        setPermissionError(false);
      } catch (error: any) {
        console.error("Error fetching stores:", error);
        if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
          setPermissionError(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStores();

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(userPos);
          setMapCenter(userPos);
        },
        () => {
          // Default to Seoul
        }
      );
    }
  }, [user]);

  // Fetch reviews
  useEffect(() => {
    if (selectedStore) {
      const fetchReviews = async () => {
        try {
            const data = await getReviews(selectedStore.id);
            setReviews(data);
        } catch (error: any) {
            console.error("Error fetching reviews:", error);
        }
      };
      fetchReviews();
    } else {
      setReviews([]);
    }
  }, [selectedStore]);

  const handleMapClick = (latlng: LatLng) => {
    if (isAddingStore) {
      setNewStoreLocation(latlng);
    }
  };

  const handleSelectStore = (store: Store) => {
    setSelectedStore(store);
    setMapCenter({ lat: store.lat, lng: store.lng });
    setIsAddingStore(false);
    setIsEditingStore(false);
    setNewStoreLocation(null);
    setIsMobileListOpen(true); // Automatically open panel when store selected
  };

  const handleMarkerClick = (store: Store) => {
    if (!isAddingStore) {
      handleSelectStore(store);
    }
  };

  const handleAddStoreSubmit = async (data: Omit<Store, 'id' | 'createdAt' | 'lat' | 'lng' | 'userId'>) => {
    if (!newStoreLocation || !user) return;
    try {
      const storeData = {
        ...data,
        lat: newStoreLocation.lat,
        lng: newStoreLocation.lng,
        userId: user.uid
      };
      
      const newId = await addStore(storeData);
      
      const newStore: Store = {
        id: newId,
        ...storeData,
        createdAt: Date.now(),
      };
      setStores([...stores, newStore]);
      handleSelectStore(newStore);
    } catch (e: any) {
      console.error(e);
      if (e.code === 'permission-denied' || e.message?.includes('Missing or insufficient permissions')) {
         alert("데이터베이스 권한 오류입니다. Firebase Console에서 Firestore 규칙을 확인해주세요.");
         setPermissionError(true);
      } else {
         alert("가게 등록에 실패했습니다.");
      }
    }
  };

  const handleUpdateStoreSubmit = async (data: Partial<Store>) => {
      if (!selectedStore) return;
      try {
          await updateStore(selectedStore.id, data);
          
          const updatedStore = { ...selectedStore, ...data };
          setStores(stores.map(s => s.id === updatedStore.id ? updatedStore : s));
          setSelectedStore(updatedStore);
          setIsEditingStore(false);
          alert("수정이 완료되었습니다.");
      } catch (e) {
          console.error(e);
          alert("수정에 실패했습니다.");
      }
  };

  const handleDeleteStore = async (store: Store) => {
      if (!window.confirm(`'${store.name}' 가게를 정말 삭제하시겠습니까?`)) return;
      try {
          await deleteStore(store.id);
          setStores(stores.filter(s => s.id !== store.id));
          setSelectedStore(null);
          alert("삭제되었습니다.");
      } catch (e) {
          console.error(e);
          alert("삭제에 실패했습니다.");
      }
  };

  const handleAddReviewSubmit = async (data: Omit<Review, 'id' | 'createdAt' | 'storeId' | 'userId'>) => {
    if (!selectedStore || !user) return;
    try {
      const reviewData = {
        ...data,
        storeId: selectedStore.id,
        userId: user.uid
      };
      
      const newReviewId = await addReview(reviewData);
      
      const newReview: Review = {
        id: newReviewId,
        ...reviewData,
        createdAt: Date.now()
      };
      // Optimistically update UI
      setReviews([newReview, ...reviews]);
      alert("소중한 후기가 등록되었습니다!");
    } catch (e: any) {
      console.error(e);
      alert("리뷰 등록에 실패했습니다.");
    }
  };

  const handleUpdateReview = async (reviewId: string, data: Partial<Review>) => {
    try {
      await updateReview(reviewId, data);
      setReviews(reviews.map(r => r.id === reviewId ? { ...r, ...data } : r));
      alert("후기가 수정되었습니다.");
    } catch (e) {
      console.error(e);
      alert("후기 수정에 실패했습니다.");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("정말 이 후기를 삭제하시겠습니까?")) return;
    try {
      await deleteReview(reviewId);
      setReviews(reviews.filter(r => r.id !== reviewId));
      alert("후기가 삭제되었습니다.");
    } catch (e) {
      console.error(e);
      alert("후기 삭제에 실패했습니다.");
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const closeMobilePanel = () => {
    setIsMobileListOpen(false);
    // Don't deselect store immediately to allow re-opening
    // If you want to clear selection: setSelectedStore(null);
  };

  if (authLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-bung-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-bung-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  // Determine if sidebar should be visible on mobile
  // Visible if: Adding store OR Selected store OR User explicitly opened list
  const isMobileSidebarVisible = isAddingStore || selectedStore || isMobileListOpen;

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col md:flex-row bg-bung-50">
      
      {/* Permission Error Banner */}
      {permissionError && (
        <div className="absolute top-0 left-0 w-full bg-red-600 text-white z-[60] p-3 flex items-center justify-center shadow-lg animate-bounce">
            <AlertTriangle className="w-6 h-6 mr-2" />
            <div className="text-sm font-medium">
                <strong>데이터베이스 권한 오류:</strong> Firebase Console 규칙 확인 필요
            </div>
            <button onClick={() => window.location.reload()} className="ml-4 underline text-xs">새로고침</button>
        </div>
      )}

      {/* Mobile Header */}
      <div className="md:hidden bg-bung-300 p-4 flex items-center justify-between shadow-md z-20 shrink-0">
        <div className="flex items-center gap-2 text-bung-900 font-bold text-xl" onClick={() => window.location.reload()}>
          <Fish className="w-8 h-8 fill-bung-700" />
          <span>붕맵</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="p-2 rounded-full bg-bung-200 text-bung-800 hover:bg-bung-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sidebar / Bottom Sheet */}
      <div className={`absolute md:relative z-30 md:z-0 w-full md:w-[400px] 
        h-[60vh] md:h-full 
        bottom-0 md:bottom-auto 
        bg-white shadow-2xl md:shadow-none
        transition-transform duration-300 ease-in-out transform 
        ${isMobileSidebarVisible ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
        md:translate-x-0 flex flex-col border-r border-bung-200 rounded-t-2xl md:rounded-none
      `}>
        {/* Mobile Drag Handle Indicator */}
        <div className="md:hidden w-full flex justify-center pt-3 pb-1" onClick={closeMobilePanel}>
            <div className="w-12 h-1.5 bg-gray-300 rounded-full cursor-pointer"></div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex p-6 bg-bung-300 items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <Fish className="w-10 h-10 text-bung-900 fill-bung-700" />
            <h1 className="text-2xl font-black text-bung-900 tracking-tight">붕맵 <span className="text-base font-normal opacity-80">Bungeoppang Map</span></h1>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-bung-400/50 text-bung-900 transition-colors"
            title="로그아웃"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-24 md:pb-4">
          {loading ? (
             <div className="flex justify-center items-center h-40">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bung-600"></div>
             </div>
          ) : isAddingStore ? (
            <StoreForm 
              locationSelected={!!newStoreLocation} 
              onSubmit={handleAddStoreSubmit} 
              onCancel={() => setIsAddingStore(false)} 
            />
          ) : isEditingStore && selectedStore ? (
            <StoreForm
              locationSelected={true}
              initialData={selectedStore}
              onSubmit={handleUpdateStoreSubmit}
              onCancel={() => setIsEditingStore(false)}
            />
          ) : selectedStore ? (
            <StoreDetail 
              store={selectedStore} 
              reviews={reviews} 
              onBack={() => {
                  setSelectedStore(null);
                  // Keep sidebar open on mobile to show list
                  setIsMobileListOpen(true);
              }}
              onAddReview={handleAddReviewSubmit}
              onUpdateReview={handleUpdateReview}
              onDeleteReview={handleDeleteReview}
              currentUser={user}
              onEdit={() => setIsEditingStore(true)}
              onDelete={handleDeleteStore}
            />
          ) : (
            <Sidebar 
                stores={stores} 
                onSelectStore={handleSelectStore} 
                onCloseMobile={() => setIsMobileListOpen(false)}
            />
          )}
        </div>

        {/* Desktop Add Button */}
        {!isAddingStore && !selectedStore && (
          <div className="hidden md:block p-4 border-t border-bung-100 bg-bung-50 shrink-0">
             <button
              onClick={() => setIsAddingStore(true)}
              className="w-full py-4 bg-bung-600 hover:bg-bung-700 text-white rounded-xl shadow-lg font-bold text-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
            >
              <Plus className="w-6 h-6" />
              가게 제보하기
            </button>
          </div>
        )}
      </div>

      {/* Map Area */}
      <div className="flex-1 relative h-full">
        {isAddingStore && !newStoreLocation && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-bung-900 text-white px-6 py-3 rounded-full shadow-xl font-medium animate-bounce whitespace-nowrap">
            지도를 클릭하여 가게 위치를 선택해주세요!
          </div>
        )}

        <KakaoMap
          center={mapCenter}
          stores={stores}
          isAddingMode={isAddingStore}
          selectedLocation={newStoreLocation}
          userLocation={currentLocation}
          onMapClick={handleMapClick}
          onMarkerClick={handleMarkerClick}
        />
        
        {/* Mobile Floating Action Buttons */}
        <div className="md:hidden absolute bottom-6 left-0 right-0 px-4 z-20 flex justify-between items-end pointer-events-none">
           {/* List Toggle Button */}
           {!isAddingStore && (
               <button
               onClick={() => {
                   setIsMobileListOpen(!isMobileSidebarVisible); // Toggle logic
                   if(isMobileSidebarVisible && selectedStore) {
                       // If closing while selected, just deselect visual focus but maybe keep state? 
                       // For now, simple toggle.
                       setSelectedStore(null); 
                   }
               }}
               className="pointer-events-auto bg-white text-bung-900 px-5 py-3 rounded-full shadow-lg font-bold flex items-center gap-2 border border-bung-100 active:scale-95 transition-transform"
             >
               {isMobileSidebarVisible ? (
                  <>
                    <MapIcon className="w-5 h-5" /> 지도 보기
                  </>
               ) : (
                  <>
                    <List className="w-5 h-5" /> 목록 보기
                  </>
               )}
             </button>
           )}

           {/* Add Store Button */}
           {!isAddingStore && (
             <button
               onClick={() => {
                 setIsAddingStore(true);
                 setSelectedStore(null);
                 setIsMobileListOpen(true); // Ensure panel opens
               }}
               className="pointer-events-auto w-14 h-14 bg-bung-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-bung-700 focus:outline-none focus:ring-4 focus:ring-bung-300 active:scale-95 transition-transform"
             >
               <Plus className="w-8 h-8" />
             </button>
           )}
           
           {/* Cancel Add Mode Button */}
           {isAddingStore && (
              <button
                onClick={() => setIsAddingStore(false)}
                className="pointer-events-auto w-full bg-red-500 text-white py-3 rounded-full shadow-lg font-bold"
              >
                취소하기
              </button>
           )}
        </div>
      </div>

      {/* Install PWA Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowInstallModal(false)}
          />
          <div className="relative bg-white w-full max-w-sm p-6 rounded-2xl shadow-2xl transform transition-all scale-100 animate-fade-in-up">
            <div className="flex flex-col items-center text-center">
               <div className="w-16 h-16 bg-bung-100 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                  <Fish className="w-10 h-10 text-bung-600 fill-bung-600" />
               </div>
               
               <h3 className="text-xl font-bold text-gray-900 mb-2">앱 설치하고 바로가기</h3>
               <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                 홈 화면에 <strong>붕맵</strong>을 추가하면<br/>
                 내 주변 붕어빵을 더 빠르게 찾을 수 있어요!
               </p>
               
               <button 
                onClick={handleInstallApp}
                className="w-full py-3.5 bg-bung-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-bung-200 hover:bg-bung-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
               >
                 <Download className="w-5 h-5" />
                 앱 내려받기
               </button>
               
               <button 
                onClick={() => setShowInstallModal(false)}
                className="mt-4 text-sm text-gray-400 font-medium hover:text-gray-600 underline decoration-gray-300 underline-offset-4"
               >
                 나중에 할게요
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}