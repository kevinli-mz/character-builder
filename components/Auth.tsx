import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { LogIn, UserPlus, Mail, Lock, User, GraduationCap } from 'lucide-react';

const FLOAT_CHARS = ['✨', '🌸', '♥', '★', '·'];
const FLOAT_DURATION_MS = 1200;

export const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; char: string }>>([]);
  const idRef = useRef(0);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const { signIn, signUp, resetPassword } = useAuth();

  const addParticle = useCallback((clientX: number, clientY: number) => {
    const id = ++idRef.current;
    const char = FLOAT_CHARS[Math.floor(Math.random() * FLOAT_CHARS.length)];
    setParticles((prev) => [...prev, { id, x: clientX, y: clientY, char }]);
    const t = setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, FLOAT_DURATION_MS);
    timeoutRefs.current.push(t);
  }, []);

  const handleAreaClick = (e: React.MouseEvent) => {
    addParticle(e.clientX, e.clientY);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          setError(error.message);
        } else {
          setMessage('注册成功！请检查您的邮箱以验证账户。');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        }
      }
    } catch (err) {
      setError('发生未知错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('请输入邮箱地址');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) {
        setError(error.message);
      } else {
        setMessage('密码重置链接已发送到您的邮箱');
      }
    } catch (err) {
      setError('发送重置链接失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#fdfbf7] p-4 cursor-default"
      onClick={handleAreaClick}
    >
      {/* Floating particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="pointer-events-none fixed text-emerald-400/90 animate-float-up"
          style={{
            left: p.x,
            top: p.y,
            transform: 'translate(-50%, -50%)',
            fontSize: '1.25rem',
            zIndex: 50,
          }}
        >
          {p.char}
        </div>
      ))}

      <div
        className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-stone-200 p-8 relative cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="text-center mb-8 cursor-pointer select-none"
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            addParticle(rect.left + rect.width / 2, rect.top + 40);
          }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-400 rounded-2xl mb-4 rotate-3 transition-transform hover:scale-110 hover:rotate-6 active:scale-95">
            <GraduationCap className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-stone-800 mb-1">
            本子的装扮屋
          </h1>
          <h2 className="text-xl font-semibold text-stone-600 mb-2">
            {isSignUp ? '创建账户' : '欢迎回来'}
          </h2>
          <p className="text-stone-500 text-sm">
            {isSignUp ? '开始装扮你的角色' : '登录以访问你的装扮'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                显示名称
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all"
                  placeholder="你的名字（可选）"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              邮箱
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all"
                placeholder="至少 6 个字符"
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl text-sm">
              {message}
            </div>
          )}

          <Button
            type="submit"
            className="w-full py-3 text-lg"
            isLoading={loading}
            disabled={loading}
          >
            {isSignUp ? (
              <>
                <UserPlus className="w-5 h-5 mr-2" />
                注册
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                登录
              </>
            )}
          </Button>
        </form>

        {!isSignUp && (
          <button
            onClick={handleForgotPassword}
            className="w-full mt-4 text-sm text-emerald-600 hover:text-emerald-700 text-center"
            disabled={loading}
          >
            忘记密码？
          </button>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setMessage(null);
            }}
            className="text-sm text-stone-500 hover:text-emerald-600"
          >
            {isSignUp ? (
              <>已有账户？<span className="font-semibold">登录</span></>
            ) : (
              <>没有账户？<span className="font-semibold">注册</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
