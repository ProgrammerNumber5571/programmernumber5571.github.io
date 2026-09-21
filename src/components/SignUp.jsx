import { useState } from 'react';
import { useAuth } from '../contexts/authContext';
import { useNavigate, Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useLanguage } from './LanguageContext.jsx';
import { defaultProfile, saveProfile } from './userProfileStore.js';
import { verifyRecaptcha } from '../lib/recaptcha.js';
import { RecaptchaNotice } from './RecaptchaNotice.jsx';

export function Signup() {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError(t.passwordsMismatch);
    }

    if (password.length < 6) {
      return setError(t.passwordTooShort);
    }

    try {
      setError('');
      setLoading(true);

      const { success } = await verifyRecaptcha('SIGNUP');
      if (!success) {
        setError(t.recaptchaFailed);
        setLoading(false);
        return;
      }

      const credential = await signup(email, password, name);
      if (credential?.user) {
        saveProfile(credential.user.uid, {
          ...defaultProfile(credential.user),
          username: username.trim(),
          name,
          email,
        });
      }
      navigate('/');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError(t.emailInUse);
      } else if (error.code === 'auth/weak-password') {
        setError(t.weakPassword);
      } else if (error.code === 'auth/invalid-email') {
        setError(t.invalidEmail);
      } else {
        setError(t.signupFailed + error.message);
      }
    }

    setLoading(false);
  }

  async function handleGoogleSignup() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/');
    } catch (error) {
      setError(t.googleSignupFailed + error.message);
    }

    setLoading(false);
  }

  function handleClose() {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative">
      <button
        type="button"
        onClick={handleClose}
        aria-label={t.closeWindow}
        className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-bold">{t.signupTitle}</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {t.signupSubtitle}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                {t.username}
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                {t.nameLabel}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                {t.passwordLabel}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium mb-2">
                {t.confirmPasswordLabel}
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? t.pleaseWait : t.signUpBtn}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">{t.orWord}</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t.googleSignUp}
          </Button>
        </form>

        <p className="text-center text-sm">
          {t.haveAccountQ}{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            {t.signInLink}
          </Link>
        </p>

        <RecaptchaNotice />
      </div>
    </div>
  );
}