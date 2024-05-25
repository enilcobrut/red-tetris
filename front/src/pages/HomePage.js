// src/pages/HomePage.js
import React from 'react';
import BackgroundAnimation from '../components/BackgroundAnimation';

import Username from '../components/Username';

function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <BackgroundAnimation />
      <div className="font-tetris">
        RED TETRIS
        <Username />
      </div>
    </main>
  );
}

export default HomePage;
