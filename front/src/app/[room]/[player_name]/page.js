
'use client'
import React from 'react';
import BackgroundAnimation from '../../../components/BackgroundAnimation';
import { useRouter } from 'next/navigation';


export default function Home() {
    const router = useRouter();

    const handleClick = () => {
        router.push('/');
      };
    
    
  return (
    <main className="flex min-h-screen items-center justify-center p-10">
      <BackgroundAnimation />
      <div className="game-container">
      </div>
    </main>
  );
}