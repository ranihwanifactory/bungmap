import React, { useState, useEffect } from 'react';
import { ShopType, Location } from '../types';
import { Button } from './Button';
import { X, MapPin, Edit3 } from 'lucide-react';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; types: ShopType[]; price: string }) => void;
  location: Location | null;
  initialData?: {
    name: string;
    description: string;
    types: ShopType[];
    price: string;
  } | null;
}

export const ShopModal: React.FC<ShopModalProps> = ({ isOpen, onClose, onSubmit, location, initialData }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<ShopType[]>([]);
  const [price, setPrice] = useState('');

  // Sync state with initialData when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setDescription(initialData.description);
        setSelectedTypes(initialData.types || []);
        setPrice(initialData.price || '');
      } else {
        // Reset for new entry
        setName('');
        setDescription('');
        setSelectedTypes([]);
        setPrice('');
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const isEditing = !!initialData;

  const handleTypeToggle = (type: ShopType) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || selectedTypes.length === 0) {
      alert("가게 이름과 붕어빵 종류를 선택해주세요!");
      return;
    }
    onSubmit({ name, description, types: selectedTypes, price });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-slide-up relative overflow-hidden">
        
        {/* Header Pattern */}
        <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${isEditing ? 'from-blue-300 via-indigo-400 to-blue-500' : 'from-amber-300 via-orange-400 to-amber-500'}`}></div>

        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 font-hand mb-1 flex items-center gap-2">
          {isEditing ? <Edit3 size={24} className="text-blue-500"/> : null} 
          {isEditing ? "가게 정보 수정" : "붕어빵 제보하기 🐟"}
        </h2>
        <p className="text-xs text-gray-500 mb-6 flex items-center gap-1">
          <MapPin size={12} />
          {isEditing 
            ? "위치는 수정할 수 없습니다." 
            : (location ? "지도 중심 위치에 등록됩니다" : "위치 정보를 가져오는 중...")
          }
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">가게 이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 행복한 잉어빵"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">어떤 붕어빵인가요? (중복선택)</label>
            <div className="flex flex-wrap gap-2">
              {Object.values(ShopType).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeToggle(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedTypes.includes(type)
                      ? 'bg-amber-500 text-white shadow-md transform scale-105'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">가격 정보 (선택)</label>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="예: 2개 1000원"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상세 설명 (선택)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="위치 설명이나 영업 시간 등 꿀팁을 공유해주세요!"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none bg-gray-50 resize-none"
            />
          </div>

          <Button type="submit" className={`w-full py-3 text-lg shadow-lg mt-2 ${isEditing ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-200' : 'shadow-amber-200/50'}`}>
            {isEditing ? "수정 완료" : "등록하기"}
          </Button>
        </form>
      </div>
    </div>
  );
};