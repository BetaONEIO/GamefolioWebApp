import React, { useState } from 'react';
import { X, Loader2, Eye, EyeOff, Mail, RefreshCw } from 'lucide-react';
import { signIn, signUp, resetPassword } from '../lib/auth';
import { sendConfirmationEmail } from '../lib/email';
import ForgotPasswordModal from './ForgotPasswordModal';

interface AuthModalProps {
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

const PASSWORD_REQUIREMENTS = [
  { regex: /.{8,}/, text: 'At least 8 characters long' },
  { regex: /[A-Z]/, text: 'Contains at least one uppercase letter' },
  { regex: /[a-z]/, text: 'Contains at least one lowercase letter' },
  { regex: /[0-9]/, text: 'Contains at least one number' },
  { regex: /[^A-Za-z0-9]/, text: 'Contains at least one special character' },
];

const RATE_LIMIT_COOLDOWN = 60; // 60 seconds cooldown

export default function AuthModal({ onClose, defaultMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'check-email' | 'forgot-password'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownTime, setCooldownTime] = useState(0);

  const passwordStrength = PASSWORD_REQUIREMENTS.filter(req => req.regex.test(password)).length;
  const passwordsMatch = password === confirmPassword;

  React.useEffect(() => {
    let timer: number;
    if (cooldownTime > 0) {
      timer = window.setInterval(() => {
        setCooldownTime(time => time - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldownTime]);

  const validatePassword = () => {
    if (mode === 'login') return true;
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (!PASSWORD_REQUIREMENTS.every(req => req.regex.test(password))) {
      setError('Password does not meet all requirements');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validatePassword()) {
      return;
    }

    if (cooldownTime > 0) {
      setError(`Please wait ${cooldownTime} seconds before trying again`);
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        await signUp(email, password);
        setMode('check-email');
      } else {
        await signIn(email, password);
        onClose();
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('rate limit') || err.message.includes('Too many signup attempts')) {
          setCooldownTime(RATE_LIMIT_COOLDOWN);
          setError(`Too many attempts. Please wait ${RATE_LIMIT_COOLDOWN} seconds before trying again.`);
        } else {
          setError(err.message);
        }
      } else {
        setError('Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (cooldownTime > 0) {
      setError(`Please wait ${cooldownTime} seconds before requesting another email`);
      return;
    }

    setResending(true);
    setError(null);
    try {
      await sendConfirmationEmail(email, `${window.location.origin}/confirm?email=${encodeURIComponent(email)}`);
      setCooldownTime(RATE_LIMIT_COOLDOWN);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('rate limit')) {
          setCooldownTime(RATE_LIMIT_COOLDOWN);
          setError(`Too many attempts. Please wait ${RATE_LIMIT_COOLDOWN} seconds before trying again.`);
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to resend confirmation email');
      }
    } finally {
      setResending(false);
    }
  };

  if (mode === 'forgot-password') {
    return (
      <ForgotPasswordModal
        onClose={onClose}
        onBack={() => setMode('login')}
      />
    );
  }

  if (mode === 'check-email') {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-lg max-w-md w-full p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-[#9FE64F]/20 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6 text-[#9FE64F]" />
            </div>
            <h2 className="text-2xl font-bold text-white">Check Your Email</h2>
            <p className="text-gray-400">
              We've sent a verification link to <span className="text-white">{email}</span>. 
              Please check your email and click the link to verify your account.
            </p>
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm">
                {error}
              </div>
            )}
            <div className="pt-4 space-y-4">
              <button
                onClick={handleResendEmail}
                disabled={resending || cooldownTime > 0}
                className="text-[#9FE64F] hover:text-[#8FD63F] font-medium flex items-center justify-center space-x-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Resending...</span>
                  </>
                ) : cooldownTime > 0 ? (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Resend in {cooldownTime}s</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Resend verification email</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setMode('login')}
                className="text-gray-400 hover:text-white"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-md w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          disabled={loading}
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-400">
            {mode === 'login' 
              ? 'Sign in to your Gamefolio account'
              : 'Join Gamefolio and start sharing your gaming moments'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FE64F]"
              disabled={loading || cooldownTime > 0}
              required
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FE64F]"
              disabled={loading || cooldownTime > 0}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {mode === 'signup' && (
            <>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FE64F] ${
                    confirmPassword && !passwordsMatch ? 'border-red-500' : ''
                  }`}
                  disabled={loading || cooldownTime > 0}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-400 font-medium">Password Requirements:</p>
                <div className="space-y-1">
                  {PASSWORD_REQUIREMENTS.map((req, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className={req.regex.test(password) ? 'text-green-500' : 'text-gray-500'}>
                        {req.regex.test(password) ? '✓' : '○'}
                      </span>
                      <span className={`text-sm ${req.regex.test(password) ? 'text-green-500' : 'text-gray-400'}`}>
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {confirmPassword && !passwordsMatch && (
                <p className="text-sm text-red-500">Passwords do not match</p>
              )}
            </>
          )}

          {mode === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setMode('forgot-password')}
                className="text-sm text-[#9FE64F] hover:text-[#8FD63F]"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || cooldownTime > 0 || (mode === 'signup' && (!passwordsMatch || passwordStrength < PASSWORD_REQUIREMENTS.length))}
            className="w-full bg-[#9FE64F] hover:bg-[#8FD63F] text-black font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
              </>
            ) : cooldownTime > 0 ? (
              <span>Please wait {cooldownTime}s</span>
            ) : (
              <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>

        <p className="text-gray-400 text-sm text-center mt-6">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-[#9FE64F] hover:text-[#8FD63F] font-medium"
                disabled={loading}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-[#9FE64F] hover:text-[#8FD63F] font-medium"
                disabled={loading}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}