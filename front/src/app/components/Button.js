import React from 'react';
import Paragraph from './Paragraph';

const Button = ({ className, color = 'blue', children, onClick }) => {
  const colorClass = color === 'blue' ? 'button-blue' : 'button-magenta';

  return (
    <button
      onClick={onClick}
      className={`button-neon ${colorClass} ${className || ''}`}
    >
      <Paragraph neon={color}>
        {children}
      </Paragraph>
    </button>
  );
};

export default Button;
