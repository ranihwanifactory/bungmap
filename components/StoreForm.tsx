import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Store, LatLng } from '../types';
import { DollarSign, Camera, MapPin, X, RefreshCw } from 'lucide-react';

interface StoreFormProps {
  locationSelected: boolean;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: Store;
  onLocationUpdate?: (location: LatLng) => void;
}

export const StoreForm: React.FC<StoreFormProps> = ({ 
  locationSelected, 
  onSubmit, 
  onCancel, 
  initialData, 
  onLocationUpdate 
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState<Store['category']>(initialData?.category || 'redbean');
  const [priceInfo, setPriceInfo] = useState(initialData?.priceInfo || '');
  const [paymentMethods, setPaymentMethods] = useState<string[]>(initialData?.paymentMethods || []);
  
  // Camera & Image State
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(initialData?.imageUrl || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const isEditing = !!initialData;

  useEffect(() => {
    // Cleanup stream on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    setIsCameraMode(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("카메라 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.");
      setIsCameraMode(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraMode(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob/file
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `store_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setImageFile(file);
          
          // Create preview URL
          const previewUrl = URL.createObjectURL(blob);
          setCapturedImage(previewUrl);
          
          // Auto-get location
          if (onLocationUpdate) {
            setGettingLocation(true);
            navigator.geolocation.getCurrentPosition(
              (position) => {
                onLocationUpdate({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                });
                setGettingLocation(false);
              },
              (error) => {
                console.error("Geolocation error:", error);
                alert("현재 위치를 가져올 수 없습니다. 지도를 클릭하여 위치를 선택해주세요.");
                setGettingLocation(false);
              },
              { enableHighAccuracy: true }
            );
          }
        }
      }, 'image/jpeg', 0.8);
    }
    
    stopCamera();
  };

  const togglePaymentMethod = (method: string) => {
    if (paymentMethods.includes(method)) {
      setPaymentMethods(paymentMethods.filter(m => m !== method));
    } else {
      setPaymentMethods([...paymentMethods, method]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationSelected && !isEditing) {
      alert("지도에서 위치를 먼저 선택해주세요!");
      return;
    }
    
    // Pass imageFile along with other data
    onSubmit({
      name,
      description,
      category,
      priceInfo,
      paymentMethods,
      imageFile
    });
  };

  // Camera View (Rendered via Portal to break out of sidebar layout)
  if (isCameraMode) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col h-[100dvh] w-screen touch-none">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline
          className="flex-1 w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Top Controls Overlay */}
        <div className="absolute top-0 w-full pt-[env(safe-area-inset-top,20px)] px-4 pb-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent z-10">
          <span className="text-white font-bold drop-shadow-md mt-2 ml-1">사진 촬영</span>
          <button onClick={stopCamera} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white mt-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Bottom Controls Overlay */}
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent pb-[env(safe-area-inset-bottom,40px)] pt-12 px-6 flex items-center justify-between z-10">
            <button onClick={stopCamera} className="text-white text-sm font-medium px-4 py-2 bg-black/20 backdrop-blur-sm rounded-full">
                취소
            </button>
            <button 
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full border-[5px] border-white/90 bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all active:scale-95 shadow-lg"
            >
                <div className="w-16 h-16 bg-white rounded-full shadow-inner" />
            </button>
            <div className="w-12"></div> {/* Spacer for alignment */}
        </div>
      </div>,
      document.body
    );
  }

  // Initial selection mode (Photo vs Map)
  if (!locationSelected && !isEditing) {
    return (
      <div className="space-y-6 h-full flex flex-col">
         <div className="flex items-center justify-between border-b border-bung-200 pb-4">
            <h2 className="text-2xl font-bold text-bung-900">가게 제보하기</h2>
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-800">닫기</button>
         </div>
         
         <div className="flex-1 flex flex-col justify-center gap-6 pb-10">
            <div className="text-center space-y-2 mb-4">
              <h3 className="text-xl font-bold text-gray-800">어떻게 제보하시겠어요?</h3>
              <p className="text-gray-500 text-sm">현장에 계시다면 사진 촬영을 추천드려요!</p>
            </div>

            <button 
              onClick={startCamera}
              className="w-full py-6 bg-bung-600 text-white rounded-2xl shadow-lg hover:bg-bung-700 flex flex-col items-center gap-3 transition-transform hover:scale-[1.02]"
            >
              <div className="p-4 bg-white/20 rounded-full">
                <Camera className="w-8 h-8" />
              </div>
              <div className="text-center">
                <span className="block text-lg font-bold">사진 찍고 자동 위치 저장</span>
                <span className="text-bung-100 text-sm">현재 위치가 자동으로 입력됩니다</span>
              </div>
            </button>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">또는</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <button 
              onClick={onCancel} // This essentially behaves as "Let me click the map" since the map is behind
              className="w-full py-6 bg-white border-2 border-bung-200 text-bung-800 rounded-2xl shadow-sm hover:bg-bung-50 flex flex-col items-center gap-3 transition-transform hover:scale-[1.02]"
            >
               <div className="p-4 bg-bung-100 rounded-full">
                <MapPin className="w-8 h-8 text-bung-600" />
              </div>
              <div className="text-center">
                <span className="block text-lg font-bold">지도에서 직접 선택</span>
                <span className="text-gray-500 text-sm">지도 핀으로 위치를 지정합니다</span>
              </div>
            </button>
         </div>
      </div>
    );
  }

  // Form View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-bung-200 pb-4">
        <h2 className="text-2xl font-bold text-bung-900">
          {isEditing ? '가게 정보 수정' : '상세 정보 입력'}
        </h2>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-800">닫기</button>
      </div>
      
      {/* Location Status */}
      {gettingLocation ? (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm font-bold">현재 위치를 가져오는 중입니다...</span>
        </div>
      ) : !locationSelected && !isEditing ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm animate-pulse">
          지도 상의 원하는 위치를 클릭하여 핀을 꽂아주세요!
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm flex items-center">
           <MapPin className="w-4 h-4 mr-2" />
           위치가 선택되었습니다.
        </div>
      )}

      {/* Image Preview / Retake */}
      <div className="flex justify-center">
         {capturedImage ? (
           <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 group">
             <img src={capturedImage} alt="Store Preview" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  type="button"
                  onClick={startCamera}
                  className="bg-white text-gray-800 px-4 py-2 rounded-full font-bold flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" /> 다시 찍기
                </button>
             </div>
           </div>
         ) : (
           <button 
            type="button"
            onClick={startCamera}
            className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-bung-400 hover:text-bung-500 transition-colors bg-gray-50"
           >
             <Camera className="w-8 h-8 mb-1" />
             <span className="text-sm font-medium">사진 추가하기</span>
           </button>
         )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-bung-800 mb-1">가게 이름 (또는 위치 설명)</label>
          <input 
            required
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="예: 행복한 잉어빵, 강남역 1번출구 앞"
            className="w-full p-3 border border-bung-200 rounded-lg focus:ring-2 focus:ring-bung-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-bung-800 mb-1">메인 메뉴</label>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value as any)}
            className="w-full p-3 border border-bung-200 rounded-lg focus:ring-2 focus:ring-bung-400 focus:outline-none bg-white"
          >
            <option value="redbean">팥 붕어빵</option>
            <option value="shucream">슈크림 붕어빵</option>
            <option value="pizza">피자/야채 붕어빵</option>
            <option value="other">기타 (미니, 고구마 등)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-bung-800 mb-1">가격 정보</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <input 
              required
              type="text" 
              value={priceInfo} 
              onChange={e => setPriceInfo(e.target.value)} 
              placeholder="예: 3개 2000원"
              className="w-full pl-9 p-3 border border-bung-200 rounded-lg focus:ring-2 focus:ring-bung-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-bung-800 mb-2">결제 방식</label>
          <div className="flex gap-2">
            {['현금', '계좌이체', '카드'].map(method => (
              <button
                key={method}
                type="button"
                onClick={() => togglePaymentMethod(method)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  paymentMethods.includes(method) 
                    ? 'bg-bung-500 text-white border-bung-500' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-bung-50'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-bung-800 mb-1">상세 설명</label>
          <textarea 
            rows={3}
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder="영업시간이나 찾는 팁 등을 적어주세요."
            className="w-full p-3 border border-bung-200 rounded-lg focus:ring-2 focus:ring-bung-400 focus:outline-none"
          />
        </div>

        <button 
          type="submit" 
          disabled={(!locationSelected && !isEditing) || gettingLocation}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-md mt-4 transition-colors
            ${(locationSelected || isEditing) && !gettingLocation
              ? 'bg-bung-600 hover:bg-bung-700 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
          `}
        >
          {isEditing ? '수정 완료' : '등록하기'}
        </button>
      </form>
    </div>
  );
};