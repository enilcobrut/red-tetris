'use client'

import React from "react";
const GameCanva = () => {
    const rows = 20;
    const cols = 10;
    const grid = [];
  
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) {
        row.push(<div key={`${i}-${j}`} className="grid-cell"></div>);
      }
      grid.push(<div key={i} className="grid-row">{row}</div>);
    }
  
    return (
      <div className="game-grid">{grid}</div>
    );
  };
  
  export default GameCanva;
  