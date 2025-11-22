import React, { useEffect, useRef, useState } from 'react';
import { Store, LatLng } from '../types';
import { MapPin } from 'lucide-react';

interface KakaoMapProps {
  center: LatLng;
  stores: Store[];
  isAddingMode: boolean;
  selectedLocation: LatLng | null;
  userLocation: LatLng | null;
  onMapClick: (location: LatLng) => void;
  onMarkerClick: (store: Store) => void;
}

export const KakaoMap: React.FC<KakaoMapProps> = ({
  center,
  stores,
  isAddingMode,
  selectedLocation,
  userLocation,
  onMapClick,
  onMarkerClick
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const markersRef = useRef<any[]>([]);
  const tempMarkerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Check if Kakao script is loaded
    if (!window.kakao || !window.kakao.maps) {
      console.warn("Kakao Maps SDK not loaded. Make sure you added the API key in index.html");
      return;
    }

    const options = {
      center: new window.kakao.maps.LatLng(center.lat, center.lng),
      level: 4
    };

    const map = new window.kakao.maps.Map(mapRef.current, options);
    setMapInstance(map);

    // Click listener
    window.kakao.maps.event.addListener(map, 'click', (mouseEvent: any) => {
      const latlng = mouseEvent.latLng;
      onMapClick({
        lat: latlng.getLat(),
        lng: latlng.getLng()
      });
    });

  }, []); 

  // Handle Map Center Update (e.g. when geolocation resolves)
  useEffect(() => {
    if(mapInstance && center) {
        const moveLatLon = new window.kakao.maps.LatLng(center.lat, center.lng);
        mapInstance.panTo(moveLatLon);
    }
  }, [center, mapInstance]);

  // Update User Marker
  useEffect(() => {
    if (!mapInstance) return;

    if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
        userMarkerRef.current = null;
    }

    if (userLocation) {
        const position = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng);
        
        // Red marker for user to distinguish from stores
        const imageSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png"; 
        const imageSize = new window.kakao.maps.Size(24, 35); 
        const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize); 

        const marker = new window.kakao.maps.Marker({
            position: position,
            map: mapInstance,
            image: markerImage,
            title: "내 위치"
        });
        
        userMarkerRef.current = marker;
    }
  }, [mapInstance, userLocation]);

  // Update Store Markers when stores change
  useEffect(() => {
    if (!mapInstance) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    stores.forEach(store => {
      const position = new window.kakao.maps.LatLng(store.lat, store.lng);
      
      // Default Blue marker for stores
      const marker = new window.kakao.maps.Marker({
        position: position,
        map: mapInstance,
        title: store.name
      });

      // Add click listener
      window.kakao.maps.event.addListener(marker, 'click', () => {
        onMarkerClick(store);
      });

      markersRef.current.push(marker);
    });

  }, [mapInstance, stores, onMarkerClick]);

  // Handle "Adding Mode" temporary marker
  useEffect(() => {
    if (!mapInstance) return;

    if (tempMarkerRef.current) {
      tempMarkerRef.current.setMap(null);
      tempMarkerRef.current = null;
    }

    if (isAddingMode && selectedLocation) {
      const position = new window.kakao.maps.LatLng(selectedLocation.lat, selectedLocation.lng);
      
      // Yellow Star for the "New Store" marker
      const imageSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png"; 
      const imageSize = new window.kakao.maps.Size(24, 35); 
      const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize); 

      const marker = new window.kakao.maps.Marker({
        position: position,
        map: mapInstance,
        image: markerImage
      });

      tempMarkerRef.current = marker;
      mapInstance.panTo(position);
    }
  }, [mapInstance, isAddingMode, selectedLocation]);

  if (!window.kakao) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 p-8 text-center">
            <div>
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50"/>
                <h3 className="text-xl font-bold mb-2">지도가 로드되지 않았습니다</h3>
                <p><code>index.html</code> 파일에서 <code>YOUR_KAKAO_MAP_API_KEY</code>를 올바른 키로 변경해주세요.</p>
            </div>
        </div>
    )
  }

  return (
    <div ref={mapRef} className="w-full h-full z-0" />
  );
};