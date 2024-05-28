import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const UserScore = ({ className }) => {
    const { socket } = useSelector(state => state.socket);
    const [scores, setScores] = useState([]);
    const [history, setHistory] = useState(null);
    const username = useSelector(state => state.user.username);

    useEffect(() => {
        if (socket && username) {
            const handleScores = (jsonData) => {
                console.log('Data received:', jsonData);
                const playerData = jsonData.find(player => player.username === username);
                if (playerData && Array.isArray(playerData.scores)) {
                    setScores(playerData.scores.sort((a, b) => b - a).slice(0, 5));
                } else {
                    console.error('Received data is not valid:', jsonData);
                }
            };

            const handleHistory = (jsonData) => {
                console.log('History received:', jsonData);
                const playerHistory = jsonData.find(player => player.username === username);
                if (playerHistory) {
                    setHistory(playerHistory);
                } else {
                    console.error('Received history data is not valid:', jsonData);
                }
            };

            socket.emit('getPlayerScores', username);
            socket.on('playerScores', handleScores);

            socket.emit('getPlayerHistory', username);
            socket.on('playerHistory', handleHistory);

            return () => {
                socket.off('playerScores', handleScores);
                socket.off('playerHistory', handleHistory);
            };
        }
    }, [socket, username]);

    return (
        <div className={`halloffame ${className}`}>
            <div className='font-username'>USER SCORE</div>
            <h2>{username}</h2>
            {scores.length > 0 ? (
                <ol>
                    {scores.map((score, index) => (
                        <li key={index}>
                            {index + 1}: {score}
                        </li>
                    ))}
                </ol>
            ) : (
                <p>Loading scores...</p>
            )}
            <h3>Multiplayer</h3>
            {history ? (
                <div>
                    <p>Played: {history.played}</p>
                    <p>Won: {history.win}</p>
                    <p>Lost: {history.loss}</p>
                </div>
            ) : (
                <p>Loading history...</p>
            )}
        </div>
    );
};

export default UserScore;
