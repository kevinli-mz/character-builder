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

  const { signIn, signUp, signInWithWechat, resetPassword } = useAuth();
  const [wechatLoading, setWechatLoading] = useState(false);

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

        {/* Divider */}
        <div className="flex items-center gap-4 mt-6">
          <div className="flex-1 h-px bg-stone-200"></div>
          <span className="text-xs text-stone-400">或</span>
          <div className="flex-1 h-px bg-stone-200"></div>
        </div>

        {/* WeChat login */}
        <button
          type="button"
          onClick={async () => {
            setError(null);
            setWechatLoading(true);
            const { error } = await signInWithWechat();
            if (error) setError(error.message);
            setWechatLoading(false);
          }}
          disabled={wechatLoading}
          className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl border border-stone-200 bg-[#07C160] hover:bg-[#06ae56] text-white font-medium transition-colors disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.3.3 0 0 0 .166-.054l1.9-1.106a.6.6 0 0 1 .3-.082.6.6 0 0 1 .166.025 10.6 10.6 0 0 0 3.092.456c.166 0 .328-.01.49-.018a6.7 6.7 0 0 1-.266-1.843c0-3.956 3.477-7.17 7.77-7.17.188 0 .373.01.557.022C16.578 4.394 12.937 2.188 8.691 2.188m-2.79 4.408a1.09 1.09 0 0 1 1.09 1.09 1.09 1.09 0 0 1-2.18 0 1.09 1.09 0 0 1 1.09-1.09m5.1 0c.603 0 1.09.489 1.09 1.09a1.09 1.09 0 0 1-2.18 0c0-.602.489-1.09 1.09-1.09M24 14.622c0-3.34-3.237-6.05-7.225-6.05-3.986 0-7.224 2.71-7.224 6.05s3.238 6.05 7.224 6.05c.853 0 1.674-.12 2.44-.34a.5.5 0 0 1 .13-.02.5.5 0 0 1 .243.066l1.495.87a.25.25 0 0 0 .13.042c.13 0 .23-.104.23-.233 0-.057-.023-.113-.038-.167l-.306-1.164a.47.47 0 0 1 .168-.523C23.025 18.18 24 16.49 24 14.622m-9.4-1.27a.86.86 0 0 1 0-1.72.86.86 0 0 1 0 1.72m4.35 0a.86.86 0 0 1 0-1.72.86.86 0 0 1 0 1.72"/>
          </svg>
          {wechatLoading ? '跳转中...' : '微信登录'}
        </button>

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
