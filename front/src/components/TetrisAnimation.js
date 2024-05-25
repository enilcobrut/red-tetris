import React, { useEffect, useRef } from 'react';
import '../styles/TetrisAnimation.css'; // Assurez-vous que le chemin est correct
import { gsap } from 'gsap';

const TetrisAnimation = () => {
  const blockRefs = useRef([]);
  blockRefs.current = [];

  const addToRefs = (el) => {
    if (el && !blockRefs.current.includes(el)) {
      blockRefs.current.push(el);
    }
  };

  useEffect(() => {
    blockRefs.current.forEach((block, index) => {
      const delay = index * 0.5; // délai de base pour chaque bloc
      gsap.fromTo(block, {
        backgroundColor: '#110023',
      }, {
        backgroundColor: getColor(block.className),
        duration: 0.5,
        delay: delay,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
      });
    });
  }, []);

  const getColor = (className) => {
    if (className.includes('a') || className.includes('b')) {
      return 'orange';
    } else if (className.includes('c') || className.includes('d')) {
      return 'lightblue';
    } else {
      return 'magenta';
    }
  };

  return (
    <div className="tetrisbg">
      <div className="container">
        {Array.from({ length: 10 }, (_, rowIndex) => (
          <div className="row" key={rowIndex}>
            {Array.from({ length: 6 }, (_, colIndex) => {
              const colClass = String.fromCharCode(97 + rowIndex); // Génère des lettres a, b, c, etc.
              return <div className={`col-xs-2 ${colClass}`} key={colIndex} ref={addToRefs}></div>;
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TetrisAnimation;
