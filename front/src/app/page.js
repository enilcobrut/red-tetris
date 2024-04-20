'use client'
import React from 'react';
import TetrisAnimation from './components/TetrisAnimation';
import BackgroundAnimation from './components/BackgroundAnimation';
import Username from './components/Username';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <BackgroundAnimation />

      <div className="font">
        RED TETRIS
        <Username />
        <TetrisAnimation />
      </div>
    </main>
  );
}
