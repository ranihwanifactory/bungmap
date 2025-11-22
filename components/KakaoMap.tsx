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

// Custom Marker SVGs (Encoded for usage)
const STORE_MARKER_SRC = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="40" height="40">
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.3"/>
  </filter>
  <g filter="url(#shadow)">
    <path fill="#F59E0B" stroke="#92400E" stroke-width="2" d="M58,32c0-12-8-20-20-20C25,12,12,22,12,22s-4-4-8-4s-4,8,0,12s8,4,8,4s-2,16,12,20c12,3.5,34-2,34-22Z"/>
    <circle cx="48" cy="24" r="2" fill="#78350F"/>
    <path fill="none" stroke="#92400E" stroke-width="2" d="M40,20c0,0-4,4-4,10"/>
    <path fill="none" stroke="#92400E" stroke-width="2" d="M30,22c0,0-4,4-4,10"/>
    <path fill="none" stroke="#92400E" stroke-width="2" d="M20,24c0,0-4,4-4,10"/>
  </g>
</svg>`);

const USER_MARKER_SRC = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80" width="40" height="50">
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="2" dy="2" stdDeviation="1" flood-opacity="0.5"/>
  </filter>
  <g filter="url(#shadow)">
    <path fill="#EF4444" d="M32,2C14.3,2,0,16.3,0,34c0,17.7,32,44,32,44s32-26.3,32-44C64,16.3,49.7,2,32,2z"/>
    <circle cx="32" cy="34" r="14" fill="#FFFFFF"/>
    <circle cx="27" cy="32" r="2.5" fill="#1F2937"/>
    <circle cx="37" cy="32" r="2.5" fill="#1F2937"/>
    <path fill="none" stroke="#1F2937" stroke-width="2.5" stroke-linecap="round" d="M27,40c2,2.5,6,2.5,10,0"/>
  </g>
</svg>`);

const ADD_MARKER_SRC = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="40" height="40">
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
    <feMerge>
      <feMergeNode in="coloredBlur"/>
      <feMergeNode in="SourceGraphic"/>
    </feMerge>
  </filter>
  <g filter="url(#glow)">
    <path fill="#EAB308" stroke="#FFFFFF" stroke-width="3" d="M32,4L39,22L58,22L44,34L49,52L32,42L15,52L20,34L6,22L25,22Z"/>
  </g>
</svg>`);

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

  // Refs to hold latest callbacks to avoid stale closures
  const onMapClickRef = useRef(onMapClick);
  const onMarkerClickRef = useRef(onMarkerClick);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

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
      // Use ref to access current props
      if (onMapClickRef.current) {
        onMapClickRef.current({
          lat: latlng.getLat(),
          lng: latlng.getLng()
        });
      }
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
        
        // Custom User Marker
        const imageSize = new window.kakao.maps.Size(40, 50); 
        const imageOption = { offset: new window.kakao.maps.Point(20, 50) };
        const markerImage = new window.kakao.maps.MarkerImage(USER_MARKER_SRC, imageSize, imageOption); 

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
      
      // Custom Fish Marker for stores
      const imageSize = new window.kakao.maps.Size(40, 40); 
      const imageOption = { offset: new window.kakao.maps.Point(20, 20) };
      const markerImage = new window.kakao.maps.MarkerImage(STORE_MARKER_SRC, imageSize, imageOption);

      const marker = new window.kakao.maps.Marker({
        position: position,
        map: mapInstance,
        image: markerImage,
        title: store.name
      });

      // Add click listener
      window.kakao.maps.event.addListener(marker, 'click', () => {
        if (onMarkerClickRef.current) {
            onMarkerClickRef.current(store);
        }
      });

      markersRef.current.push(marker);
    });

  }, [mapInstance, stores]); // onMarkerClick removed from deps, using ref

  // Handle "Adding Mode" temporary marker
  useEffect(() => {
    if (!mapInstance) return;

    if (tempMarkerRef.current) {
      tempMarkerRef.current.setMap(null);
      tempMarkerRef.current = null;
    }

    if (isAddingMode && selectedLocation) {
      const position = new window.kakao.maps.LatLng(selectedLocation.lat, selectedLocation.lng);
      
      // Custom Star Marker for Selection
      const imageSize = new window.kakao.maps.Size(40, 40); 
      const imageOption = { offset: new window.kakao.maps.Point(20, 20) };
      const markerImage = new window.kakao.maps.MarkerImage(ADD_MARKER_SRC, imageSize, imageOption);

      const marker = new window.kakao.maps.Marker({
        position: position,
        map: mapInstance,
        image: markerImage,
        zIndex: 3 // Show above others
      });

      tempMarkerRef.current = marker;
      // Optionally pan to selection
      // mapInstance.panTo(position); 
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