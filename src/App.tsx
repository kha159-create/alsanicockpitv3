import React, { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useLocale } from './context/LocaleContext';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import MainLayout from './components/MainLayout';

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto"></div>
      <p className="mt-4 text-xl font-semibold text-zinc-700">Initializing...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const { locale } = useLocale();
  const [authPage, setAuthPage] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {user ? (
        <MainLayout user={user} profile={profile} />
      ) : authPage === 'login' ? (
        <LoginPage onSwitchToSignUp={() => setAuthPage('signup')} />
      ) : (
        <SignUpPage onSwitchToLogin={() => setAuthPage('login')} />
      )}
    </div>
  );
};

export default App;
