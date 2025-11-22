import React from 'react';
import { Store } from '../types';
import { MapPin, ArrowRight } from 'lucide-react';

interface SidebarProps {
  stores: Store[];
  onSelectStore: (store: Store) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ stores, onSelectStore }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
         <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider">내 주변 붕어빵 ({stores.length})</h3>
      </div>
      
      {stores.length === 0 ? (
        <div className="text-center py-10 opacity-60">
            <img src="https://cdn-icons-png.flaticon.com/512/743/743231.png" alt="No Data" className="w-20 h-20 mx-auto mb-4 opacity-30 grayscale" />
            <p className="text-gray-500">등록된 가게가 없습니다.<br/>여러분이 첫 가게를 제보해주세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {stores.map(store => (
            <div 
              key={store.id} 
              onClick={() => onSelectStore(store)}
              className="bg-white border border-bung-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex items-center justify-between"
            >
              <div>
                <h4 className="font-bold text-gray-800 group-hover:text-bung-700 transition-colors mb-1">{store.name}</h4>
                <div className="flex items-center text-xs text-gray-500 mb-1">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium mr-2">
                        {store.category === 'redbean' ? '팥' : 
                         store.category === 'shucream' ? '슈크림' : 
                         store.category === 'pizza' ? '피자' : '기타'}
                    </span>
                    <span>{store.priceInfo}</span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-bung-500" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
