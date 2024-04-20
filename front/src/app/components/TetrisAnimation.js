import React from 'react';
import '../styles/TetrisAnimation.css'; // Ensure this path is correct

const TetrisAnimation = () => {
  return (
    <div className="tetrisbg">
      <div className="container">
        {Array.from({ length: 10 }, (_, rowIndex) => (
          <div className="row" key={rowIndex}>
            {Array.from({ length: 6 }, (_, colIndex) => {
              const colClass = String.fromCharCode(97 + rowIndex); // Generates letters a, b, c, etc.
              return <div className={`col-xs-2 ${colClass}`} key={colIndex}></div>;
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TetrisAnimation;
