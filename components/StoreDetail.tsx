import React, { useState, useEffect } from 'react';
import { Store, Review } from '../types';
import { ArrowLeft, Star, Wallet, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react';

interface StoreDetailProps {
  store: Store;
  reviews: Review[];
  isLoading?: boolean;
  onBack: () => void;
  onAddReview: (review: any) => void;
  onUpdateReview: (reviewId: string, data: any) => void;
  onDeleteReview: (reviewId: string) => void;
  onEdit: (store: Store) => void;
  onDelete: (store: Store) => void;
  currentUser: any;
}

export const StoreDetail: React.FC<StoreDetailProps> = ({ 
  store, 
  reviews, 
  isLoading = false,
  onBack, 
  onAddReview, 
  onUpdateReview,
  onDeleteReview,
  onEdit,
  onDelete,
  currentUser 
}) => {
  const [isReviewing, setIsReviewing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // Edit Review State
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editComment, setEditComment] = useState('');
  const [editRating, setEditRating] = useState(5);

  const isOwner = currentUser && store.userId === currentUser.uid;

  useEffect(() => {
    if (currentUser) {
        const defaultName = currentUser.displayName || currentUser.email?.split('@')[0] || '';
        setNickname(defaultName);
    }
  }, [currentUser]);

  const categoryLabel = {
    redbean: '팥',
    shucream: '슈크림',
    pizza: '피자/야채',
    other: '기타'
  }[store.category];

  const categoryColor = {
    redbean: 'bg-red-800 text-white',
    shucream: 'bg-yellow-400 text-yellow-900',
    pizza: 'bg-orange-600 text-white',
    other: 'bg-gray-600 text-white'
  }[store.category];

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    onAddReview({ nickname, rating, comment });
    setIsReviewing(false);
    setComment('');
    setRating(5);
  };

  const startEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setEditComment(review.comment);
    setEditRating(review.rating);
  };

  const cancelEditReview = () => {
    setEditingReviewId(null);
    setEditComment('');
    setEditRating(5);
  };

  const submitEditReview = (reviewId: string) => {
    onUpdateReview(reviewId, {
      comment: editComment,
      rating: editRating
    });
    setEditingReviewId(null);
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) 
    : '0.0';

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="flex items-center text-bung-700 hover:text-bung-900 font-medium px-2 py-1 -ml-2 rounded hover:bg-bung-100 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-1" /> 목록으로
        </button>
        
        {isOwner && (
          <div className="flex gap-2">
            <button 
              onClick={() => onEdit(store)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="수정"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onDelete(store)}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Store Image */}
      {store.imageUrl && (
        <div className="w-full h-48 rounded-2xl overflow-hidden shadow-sm border border-bung-100">
           <img src={store.imageUrl} alt={store.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Header Info */}
      <div className="bg-bung-50 p-6 rounded-2xl border border-bung-100 shadow-sm">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{store.name}</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${categoryColor} h-fit whitespace-nowrap`}>
            {categoryLabel}
          </span>
        </div>
        
        <div className="flex items-center gap-1 text-yellow-500 mb-4 font-bold text-lg">
          <Star className="fill-current w-5 h-5" />
          <span>{averageRating}</span>
          <span className="text-gray-400 text-sm font-normal">({reviews.length}명 참여)</span>
        </div>

        <div className="space-y-3 text-gray-700 text-sm">
            <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-bung-500" />
                <span>{store.priceInfo}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex flex-wrap gap-1">
                    {store.paymentMethods.map(m => (
                         <span key={m} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-600">{m}</span>
                    ))}
                </div>
            </div>
            {store.description && (
                 <div className="bg-white p-3 rounded-lg border border-bung-100 text-gray-600 mt-2 whitespace-pre-line">
                    {store.description}
                 </div>
            )}
        </div>
      </div>

      {/* Review Section */}
      <div className="pb-10">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">방문 후기</h3>
            <button 
                onClick={() => setIsReviewing(!isReviewing)}
                className="text-sm text-bung-600 font-semibold hover:underline bg-bung-50 px-3 py-1.5 rounded-lg"
            >
                {isReviewing ? '작성 취소' : '후기 쓰기'}
            </button>
        </div>

        {isReviewing && (
            <form onSubmit={handleSubmitReview} className="bg-white border border-bung-200 p-4 rounded-xl mb-6 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <input 
                        type="text" 
                        placeholder="닉네임"
                        required
                        value={nickname}
                        onChange={e => setNickname(e.target.value)}
                        className="w-full sm:w-1/3 p-2 border border-gray-200 rounded focus:outline-none focus:border-bung-400 text-sm"
                    />
                     <div className="flex items-center border border-gray-200 rounded px-2 py-1 sm:py-0">
                        <span className="text-xs mr-2 text-gray-500">평점</span>
                        <select value={rating} onChange={e => setRating(Number(e.target.value))} className="bg-transparent focus:outline-none text-sm font-bold text-yellow-500">
                            <option value="5">5점</option>
                            <option value="4">4점</option>
                            <option value="3">3점</option>
                            <option value="2">2점</option>
                            <option value="1">1점</option>
                        </select>
                        <Star className="w-3 h-3 text-yellow-500 ml-1 fill-current" />
                    </div>
                </div>
                <textarea 
                    placeholder="맛은 어땠나요? 사장님은 친절하신가요?"
                    required
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded mb-3 focus:outline-none focus:border-bung-400 text-sm h-20 resize-none"
                />
                <button type="submit" className="w-full bg-bung-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-bung-700">등록하기</button>
            </form>
        )}

        <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-8">
                 <Loader2 className="w-8 h-8 animate-spin text-bung-500" />
              </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl">
                    아직 등록된 후기가 없습니다. <br/>첫 번째 후기를 남겨주세요!
                </div>
            ) : (
                reviews.map(review => (
                    <div key={review.id} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                        {editingReviewId === review.id ? (
                            // Edit Mode
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-800 text-sm">{review.nickname}</span>
                                    <div className="flex items-center border border-gray-200 rounded px-2 py-1">
                                        <select 
                                            value={editRating} 
                                            onChange={e => setEditRating(Number(e.target.value))} 
                                            className="bg-transparent focus:outline-none text-xs font-bold text-yellow-500"
                                        >
                                            <option value="5">5점</option>
                                            <option value="4">4점</option>
                                            <option value="3">3점</option>
                                            <option value="2">2점</option>
                                            <option value="1">1점</option>
                                        </select>
                                    </div>
                                </div>
                                <textarea 
                                    value={editComment}
                                    onChange={e => setEditComment(e.target.value)}
                                    className="w-full p-2 border border-bung-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-bung-400"
                                    rows={2}
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={cancelEditReview} className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded hover:bg-gray-200">취소</button>
                                    <button onClick={() => submitEditReview(review.id)} className="px-3 py-1.5 text-xs font-bold text-white bg-bung-600 rounded hover:bg-bung-700">수정 완료</button>
                                </div>
                            </div>
                        ) : (
                            // View Mode
                            <>
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-800 text-sm">{review.nickname}</span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center bg-yellow-50 px-1.5 py-0.5 rounded text-yellow-600">
                                        <Star className="w-3 h-3 fill-current mr-1" />
                                        <span className="text-xs font-bold">{review.rating}</span>
                                    </div>
                                </div>
                                <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{review.comment}</p>
                                
                                {/* Owner Actions */}
                                {currentUser && currentUser.uid === review.userId && (
                                    <div className="flex justify-end gap-3 mt-2 pt-2 border-t border-gray-50">
                                        <button 
                                            onClick={() => startEditReview(review)}
                                            className="flex items-center text-xs text-gray-400 hover:text-bung-600 transition-colors"
                                        >
                                            <Pencil className="w-3 h-3 mr-1" /> 수정
                                        </button>
                                        <button 
                                            onClick={() => onDeleteReview(review.id)}
                                            className="flex items-center text-xs text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-3 h-3 mr-1" /> 삭제
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};