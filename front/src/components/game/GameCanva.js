import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {  useSelector } from 'react-redux';


const GameCanva = () => {
    const { socket } = useSelector(state => state.socket);
    const navigate = useNavigate();
    const rows = 20;
    const cols = 10;
    const [grid, setGrid] = useState(Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({ filled: false, color: 'transparent' }))
    ));

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.repeat) return; // Ignore les appuis répétés sur la même touche
            switch (event.key) {
                case 'ArrowLeft':
                    socket.emit('move', { direction: 'left' });
                    break;
                case 'ArrowRight':
                    socket.emit('move', { direction: 'right' });
                    break;
                case 'ArrowUp':
                    socket.emit('rotate');
                    break;
                case 'ArrowDown':
                    socket.emit('fall'); // Envoyé une seule fois à la première pression
                    break;
                case ' ':
                    socket.emit('drop');
                    break;
                default:
                    break;
            }
        };
    
        const handleKeyUp = (event) => {
            switch (event.key) {
                case 'ArrowDown':
                    socket.emit('stopFall'); // Envoyer cet événement quand la touche est relâchée
                    break;
                default:
                    break;
            }
        };
    
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
    
        // Assurez-vous de nettoyer les événements après le démontage du composant
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, [socket]); // Ajoutez d'autres dépendances si nécessaire
    

    useEffect(() => {
        if (!socket) {
            navigate('/');
            console.error("Socket is not defined");
            return;
        }
    
        const handleGridUpdate = ({ grid: receivedGrid }) => {
            console.log("Grid updated from server:", receivedGrid);
            if (receivedGrid.length === cols && receivedGrid[0].length === rows) {
                console.error("Grid dimensions are transposed. Correcting...");
                const correctedGrid = receivedGrid[0].map((_, colIndex) =>
                    receivedGrid.map(row => row[colIndex])
                );
                setGrid(correctedGrid);
            } else if (receivedGrid.length === rows && receivedGrid[0].length === cols) {
                console.log("Grid structure is correct");
                setGrid(receivedGrid);
            } else {
                console.error("Incorrect grid structure", receivedGrid);
            }
        };
        const handleGameOver = () => {
            console.log("Game over, redirecting to homepage");
            navigate('/');
        };

    
        socket.on('grid_update', handleGridUpdate);
        socket.on('game_over', handleGameOver);

    
        return () => {
            socket.off('grid_update', handleGridUpdate);
            socket.off('game_over', handleGameOver);

        };
    }, [socket, navigate]);
    

    return (
        <div className="game-grid">
            {Array.from({ length: cols }).map((_, colIndex) => (
                <div key={colIndex} className="grid-column">
                    {grid.map((row, rowIndex) => (
                        <div
                            key={`${colIndex}-${rowIndex}`}
                            className={`grid-cell ${row[colIndex].color !== 'transparent' && row[colIndex].color !== 'rgba(0, 0, 0, 0)' ? 'filled-cell' : ''}`}
                            style={{ backgroundColor: row[colIndex].color }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

export default GameCanva;
