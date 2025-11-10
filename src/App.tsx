import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PublicHome } from './components/PublicHome';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { Dashboard } from './components/Dashboard';

type View = 'home' | 'login' | 'register' | 'dashboard';

function AppContent() {
  const [currentView, setCurrentView] = useState<View>('home');
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Cargando...</div>
      </div>
    );
  }

  if (user && currentView !== 'dashboard') {
    setCurrentView('dashboard');
  }

  if (currentView === 'dashboard' && user) {
    return <Dashboard />;
  }

  if (currentView === 'login') {
    return (
      <LoginForm
        onSuccess={() => setCurrentView('dashboard')}
        onRegister={() => setCurrentView('register')}
        onCancel={() => setCurrentView('home')}
      />
    );
  }

  if (currentView === 'register') {
    return (
      <RegisterForm
        onSuccess={() => setCurrentView('dashboard')}
        onLogin={() => setCurrentView('login')}
        onCancel={() => setCurrentView('home')}
      />
    );
  }

  return (
    <PublicHome
      onLogin={() => setCurrentView('login')}
      onRegister={() => setCurrentView('register')}
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
