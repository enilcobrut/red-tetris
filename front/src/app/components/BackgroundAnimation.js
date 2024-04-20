'use client'
import React, { useEffect, useState } from 'react';
import '../styles/BackgroundAnimation.css';

const BackgroundAnimation = () => {
  const [cubes, setCubes] = useState([]);

  useEffect(() => {
    const tempCubes = [];
    for (let i = 0; i < 20; i++) {
      const style = {
        left: `${Math.random() * 100}vw`,
        top: `${Math.random() * 100}vh`,
        animationDelay: `${Math.random() * 5}s`,
      };
      tempCubes.push(<div className="cube" style={style} key={i}></div>);
    }
    setCubes(tempCubes);
  }, []);

  return (
    <div className="cube-container">
      {cubes}
    </div>
  );
};

export default BackgroundAnimation;
