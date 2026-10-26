'use client';

import { CustomerStore } from '@/components/commerce';

export default function Home() {
  return (
    <CustomerStore
      session={null}
      onSignOut={undefined}
    />
  );
}
