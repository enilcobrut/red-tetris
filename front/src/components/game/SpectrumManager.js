import React, { useState, useEffect } from 'react';
import Paragraph from '../Paragraph';
const SpectrumManager = ({ socket, players }) => {
  const [spectrums, setSpectrums] = useState({});

  useEffect(() => {
    const handleSpectrumUpdate = (data) => {
      setSpectrums(prev => ({
        ...prev,
        [data.playerSocketId]: data.spectrumGrid
      }));
    };

    if (socket) {
      socket.on('update_spectrums', handleSpectrumUpdate);
    }

    return () => {
      if (socket) {
        socket.off('update_spectrums', handleSpectrumUpdate);
      }
    };
  }, [socket]);

  return (
    <div className='flex flex-col'>
      {players.map((player, index) => (
        socket.id !== player.socketId && (
          <div key={index} className="player-spectrum">
            <Paragraph>{player.name}</Paragraph>
            {spectrums[player.socketId] && spectrums[player.socketId].length > 0 && (
              <div className="game-spectrum">
                {Array.from({ length: spectrums[player.socketId][0].length }).map((_, colIndex) => (
                  <div key={colIndex} className="grid-column">
                    {spectrums[player.socketId].map((row, rowIndex) => (
                      <div
                        key={`${colIndex}-${rowIndex}`}
                        className="grid-cell-spectrum"
                        style={{ backgroundColor: row[colIndex].color }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      ))}
    </div>
  );
};

export default SpectrumManager;
