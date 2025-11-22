import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { Fish } from 'lucide-react';

export const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err.code);
      switch (err.code) {
        case 'auth/invalid-email':
          setError('이메일 형식이 올바르지 않습니다.');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('이메일 또는 비밀번호를 확인해주세요.');
          break;
        case 'auth/email-already-in-use':
          setError('이미 사용 중인 이메일입니다.');
          break;
        case 'auth/weak-password':
          setError('비밀번호는 6자 이상이어야 합니다.');
          break;
        default:
          setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('Firebase Console에서 현재 도메인을 승인해야 합니다.');
      } else {
        setError('구글 로그인 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-bung-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-bung-100">
        <div className="flex flex-col items-center mb-8">
           <div className="bg-bung-100 p-4 rounded-full mb-4 shadow-inner">
              <Fish className="w-12 h-12 text-bung-600 fill-bung-600" />
           </div>
           <h1 className="text-3xl font-black text-bung-900 tracking-tight">붕맵 BungMap</h1>
           <p className="text-bung-700 mt-2 font-medium">우리 동네 붕어빵 찾기</p>
        </div>

        <div className="flex mb-6 bg-bung-50 rounded-lg p-1 border border-bung-100">
          <button
            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all duration-200 ${isLogin ? 'bg-white text-bung-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            로그인
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all duration-200 ${!isLogin ? 'bg-white text-bung-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            회원가입
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-bung-800 mb-1 ml-1">이메일</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-bung-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-bung-400 transition-all"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-bung-800 mb-1 ml-1">비밀번호</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-bung-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-bung-400 transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && <div className="bg-red-50 text-red-500 text-xs p-3 rounded-lg font-medium text-center animate-pulse">{error}</div>}

          <button
            type="submit"
            className="w-full py-3.5 bg-bung-600 text-white rounded-xl font-bold shadow-lg hover:bg-bung-700 hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center"
          >
            {isLogin ? '시작하기' : '가입하기'}
          </button>
        </form>

        <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-bung-200"></div>
            <span className="flex-shrink-0 mx-4 text-bung-400 text-xs font-medium">또는</span>
            <div className="flex-grow border-t border-bung-200"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 border border-bung-200 bg-white text-gray-700 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-bung-50 transition-all shadow-sm hover:shadow-md"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google로 시작하기
        </button>
      </div>
    </div>
  );
};