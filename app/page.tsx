'use client';

import { useEffect, useState } from 'react';
import { CustomerStore } from '@/components/commerce';
import { supabase } from '@/lib/supabase';

type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];

export default function Home() {
  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.error('Erro ao recuperar sessão:', error);
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#170824] text-white">
        <div className="mx-auto max-w-7xl px-5 py-16 text-sm text-[#C6A6F2]">
          Carregando a Clarimê...
        </div>
      </main>
    );
  }

  return (
    <CustomerStore
      session={session}
      onSignOut={session ? () => { void supabase.auth.signOut(); } : undefined}
    />
  );
}

