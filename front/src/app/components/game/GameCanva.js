'use client'
import React, { useState, useEffect } from 'react';
import { useSocket } from '@/app/context/SocketContext';

const GameCanva = () => {
    const { socket } = useSocket();
    const rows = 20;
    const cols = 10;
    const [grid, setGrid] = useState(Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({ filled: false, color: 'transparent' }))
    ));

    useEffect(() => {
        const handleNewPiece = ({ piece }) => {
            const newGrid = grid.slice(); // Créez une copie de la grille pour déclencher une mise à jour d'état
            // Code du GameCanva resterait essentiellement le même, mais assurez-vous que la logique prend en compte `y < 0`
            piece.shape.forEach((row, dy) => {
                row.forEach((cell, dx) => {
                    if (cell) {
                        const x = dx + piece.position.x;
                        const y = dy + piece.position.y;
                        // Assurez-vous que la condition ci-dessous gère correctement y < 0
                        if (y >= 0 && y < rows && x >= 0 && x < cols) {
                            newGrid[x][y] = { filled: true, color: piece.color };
                        }
                    }
                });
            });

            setGrid(newGrid);
        };

        if (socket) {
            socket.on('new_piece', handleNewPiece);

            return () => {
                socket.off('new_piece', handleNewPiece);
            };
        }
    }, [socket, grid]);

    return (
        <div className="game-grid">
            {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="grid-row">
                    {row.map((cell, cellIndex) => (
                        <div
                            key={cellIndex}
                            className="grid-cell"
                            style={{ backgroundColor: cell.filled ? cell.color : 'transparent' }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

export default GameCanva;
