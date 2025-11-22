import React, { useState, useEffect } from 'react';
import { KakaoMap } from './components/KakaoMap';
import { Sidebar } from './components/Sidebar';
import { StoreForm } from './components/StoreForm';
import { StoreDetail } from './components/StoreDetail';
import { AuthForm } from './components/AuthForm';
import { Store, Review, LatLng } from './types';
import { getStores, addStore, getReviews, addReview, updateStore, deleteStore } from './services/firebaseService';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Plus, Fish, LogOut, AlertTriangle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [stores, setStores] = useState<Store[]>([]);
  
  // UI States
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [isEditingStore, setIsEditingStore] = useState(false); // New: Editing State
  
  // Location States
  const [newStoreLocation, setNewStoreLocation] = useState<LatLng | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLng>({ lat: 37.5665, lng: 126.9780 }); // New: Explicit Map Center
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New state for permission errors
  const [permissionError, setPermissionError] = useState(false);

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
    if (!user) return; // Only fetch if logged in

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
          setMapCenter(userPos); // Move map to user initially
        },
        () => {
          // Default to Seoul if permission denied (already set in default state)
        }
      );
    }
  }, [user]);

  // Fetch reviews when a store is selected
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
    } else {
      // Do nothing if just viewing
    }
  };

  // Helper to select a store and move map
  const handleSelectStore = (store: Store) => {
    setSelectedStore(store);
    setMapCenter({ lat: store.lat, lng: store.lng }); // Pan map to store
    setIsAddingStore(false);
    setIsEditingStore(false);
    setNewStoreLocation(null);
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
      
      // Select the new store and move map
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
      setReviews([newReview, ...reviews]);
    } catch (e: any) {
      console.error(e);
      alert("리뷰 등록에 실패했습니다.");
    }
  };

  const handleLogout = () => {
    signOut(auth);
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

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col md:flex-row bg-bung-50">
      
      {/* Permission Error Banner */}
      {permissionError && (
        <div className="absolute top-0 left-0 w-full bg-red-600 text-white z-50 p-3 flex items-center justify-center shadow-lg animate-bounce">
            <AlertTriangle className="w-6 h-6 mr-2" />
            <div className="text-sm font-medium">
                <strong>데이터베이스 권한 오류:</strong> Firebase Console &gt; Firestore Database &gt; [규칙] 탭에서 
                <code className="bg-red-800 px-2 py-0.5 rounded mx-1">allow read, write: if request.auth != null;</code>
                로 설정해주세요.
            </div>
            <button onClick={() => window.location.reload()} className="ml-4 underline text-xs">새로고침</button>
        </div>
      )}

      {/* Mobile Header */}
      <div className="md:hidden bg-bung-300 p-4 flex items-center justify-between shadow-md z-20">
        <div className="flex items-center gap-2 text-bung-900 font-bold text-xl">
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
          <button 
            onClick={() => {
              setIsAddingStore(!isAddingStore);
              setSelectedStore(null);
              setNewStoreLocation(null);
              setIsEditingStore(false);
            }}
            className={`p-2 rounded-full shadow-lg transition-all ${isAddingStore ? 'bg-red-500 text-white' : 'bg-bung-800 text-white'}`}
          >
            {isAddingStore ? '취소' : <Plus />}
          </button>
        </div>
      </div>

      {/* Sidebar (Left Panel) */}
      <div className={`absolute md:relative z-20 md:z-0 w-full md:w-[400px] h-[50vh] md:h-full bottom-0 md:bottom-auto bg-white shadow-2xl transition-transform duration-300 transform 
        ${(selectedStore || isAddingStore) ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
        md:translate-x-0 flex flex-col border-r border-bung-200
      `}>
        {/* Desktop Header */}
        <div className="hidden md:flex p-6 bg-bung-300 items-center justify-between shadow-sm">
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

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
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
              locationSelected={true} // Location is already known for existing store
              initialData={selectedStore}
              onSubmit={handleUpdateStoreSubmit}
              onCancel={() => setIsEditingStore(false)}
            />
          ) : selectedStore ? (
            <StoreDetail 
              store={selectedStore} 
              reviews={reviews} 
              onBack={() => setSelectedStore(null)}
              onAddReview={handleAddReviewSubmit}
              currentUser={user}
              onEdit={() => setIsEditingStore(true)}
              onDelete={handleDeleteStore}
            />
          ) : (
            <Sidebar stores={stores} onSelectStore={handleSelectStore} />
          )}
        </div>

        {/* Desktop Add Button */}
        {!isAddingStore && !selectedStore && (
          <div className="hidden md:block p-4 border-t border-bung-100 bg-bung-50">
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
        {/* Helper Toast */}
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
        
        {/* Floating Add Button for Mobile (when not in a mode) */}
        {!isAddingStore && !selectedStore && (
           <button
             onClick={() => setIsAddingStore(true)}
             className="md:hidden absolute bottom-6 right-6 z-30 w-14 h-14 bg-bung-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-bung-700 focus:outline-none focus:ring-4 focus:ring-bung-300"
           >
             <Plus className="w-8 h-8" />
           </button>
        )}
      </div>
    </div>
  );
}