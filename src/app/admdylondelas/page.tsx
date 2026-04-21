'use client';

import { useRouter } from 'next/navigation';
import AdminDashboard from '@/components/admin-dashboard';
import { useSupabase } from '@/firebase';

export default function AdminPage() {
  const supabase = useSupabase();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return <AdminDashboard onLogout={handleLogout} />;
}
