
'use client';

import { useState, useEffect } from 'react';
import AdminDashboard from '@/components/admin-dashboard';
import AdminLogin from '@/components/admin-login';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('admdylondelas-auth');
    if (session === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    localStorage.setItem('admdylondelas-auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admdylondelas-auth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
}
