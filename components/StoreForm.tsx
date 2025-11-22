import React, { useState, useEffect } from 'react';
import { Store } from '../types';
import { DollarSign } from 'lucide-react';

interface StoreFormProps {
  locationSelected: boolean;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: Store;
}

export const StoreForm: React.FC<StoreFormProps> = ({ locationSelected, onSubmit, onCancel, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState<Store['category']>(initialData?.category || 'redbean');
  const [priceInfo, setPriceInfo] = useState(initialData?.priceInfo || '');
  const [paymentMethods, setPaymentMethods] = useState<string[]>(initialData?.paymentMethods || []);

  const isEditing = !!initialData;

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
    onSubmit({
      name,
      description,
      category,
      priceInfo,
      paymentMethods
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-bung-200 pb-4">
        <h2 className="text-2xl font-bold text-bung-900">
          {isEditing ? '가게 정보 수정' : '가게 제보하기'}
        </h2>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-800">닫기</button>
      </div>
      
      {!locationSelected && !isEditing && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm animate-pulse">
          지도 상의 원하는 위치를 클릭하여 핀을 꽂아주세요!
        </div>
      )}

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
          disabled={!locationSelected && !isEditing}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-md mt-4 transition-colors
            ${(locationSelected || isEditing) 
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