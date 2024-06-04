import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Paragraph from '../Paragraph';
const UserScore = ({ className }) => {
    const { socket } = useSelector(state => state.socket);
    const [scores, setScores] = useState([]);
    const [history, setHistory] = useState(null);
    const username = useSelector(state => state.user.username);

    useEffect(() => {
        if (socket && username) {
            const handleScores = (jsonData) => {
                console.log('Data received:', jsonData);
                if (Array.isArray(jsonData)) {
                    const playerData = jsonData.find(player => player.username === username);
                    if (playerData && Array.isArray(playerData.scores)) {
                        setScores(playerData.scores.sort((a, b) => b - a).slice(0, 5));
                    } else {
                        console.error('Received data is not valid:', jsonData);
                    }
                } else if (jsonData && jsonData.username === username && Array.isArray(jsonData.scores)) {
                    setScores(jsonData.scores.sort((a, b) => b - a).slice(0, 5));
                } else {
                    console.error('Received data is not valid:', jsonData);
                }
            };

            const handleHistory = (jsonData) => {
                console.log('Statistics received:', jsonData);
                if (Array.isArray(jsonData)) {
                    const playerHistory = jsonData.find(player => player.username === username);
                    if (playerHistory) {
                        setHistory(playerHistory);
                    } else {
                        console.error('Received history data is not valid:', jsonData);
                    }
                } else if (jsonData && jsonData.username === username) {
                    setHistory(jsonData);
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
            <div className='flex flex-col gap-5 w-full justify-center items-center'>
            <div className='font-username-2'>{username} best scores</div>
            {scores.length > 0 ? (
                <div className="list-container w-full overflow-y-auto pr-2">  {/* Add the list-container class here */}
                    {scores.map((score, index) => (
                        <div key={index} className="list-item w-full px-2 py-4">  {/* Add the list-item class here */}
                                <Paragraph 
                                    displayFlex={false} 
                                    size="small"
                                    style={{ color: 'white' }}
                                    className="shrink-0">
                                   {index + 1}
                                </Paragraph>
                                <Paragraph 
                                    displayFlex={false} 
                                    size="small"
                                    style={{ color: 'white' }}
                                    className="shrink-0">
                                   {score}
                                </Paragraph>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="list-item-2 w-full p-5">

                <Paragraph 
                displayFlex={false} 
                size="small"
                style={{ color: 'white' }}>
                NO SCORE YET! GO PLAY A GAME !
            </Paragraph>
            </div>
            )}

            <div className='font-username-2'>USER STATISTICS</div>
            {history ? (
                <div className="list-container w-full overflow-y-auto pr-2">  {/* Add the list-container class here */}
                    <div className="list-item w-full px-2 py-4">
                        <Paragraph 
                            displayFlex={false} 
                            size="small"
                            style={{ color: 'white' }}
                            className="shrink-0">
                            PLAYED
                        </Paragraph>
                        <Paragraph 
                            displayFlex={false} 
                            size="small"
                            style={{ color: 'white' }}
                            className="shrink-0">
                            {history.played}
                        </Paragraph>

                    </div>
                <div className="list-item w-full px-2 py-4">
                        <Paragraph 
                            displayFlex={false} 
                            size="small"
                            style={{ color: 'white' }}
                            className="shrink-0">
                            SINGLE
                        </Paragraph>
                        <Paragraph 
                            displayFlex={false} 
                            size="small"
                            style={{ color: 'white' }}
                            className="shrink-0">
                            {history.single}
                        </Paragraph>

                    </div>
                    <div className="list-item w-full px-2 py-4">
                        <Paragraph 
                            displayFlex={false} 
                            size="small"
                            style={{ color: 'white' }}
                            className="shrink-0">
                            WON
                        </Paragraph>
                        <Paragraph 
                            displayFlex={false} 
                            size="small"
                            style={{ color: 'white' }}
                            className="shrink-0">
                            {history.win}
                        </Paragraph>

                    </div>
                    <div className="list-item w-full px-2 py-4">
                        <Paragraph 
                            displayFlex={false} 
                            size="small"
                            style={{ color: 'white' }}
                            className="shrink-0">
                            LOST
                        </Paragraph>
                        <Paragraph 
                            displayFlex={false} 
                            size="small"
                            style={{ color: 'white' }}
                            className="shrink-0">
                            {history.loss}
                        </Paragraph>
                    </div>
                    <div className="list-item w-full px-2 py-4">
                        <Paragraph 
                            displayFlex={false} 
                            size="small"
                            style={{ color: 'white' }}
                            className="shrink-0">
                            LINES CLEARED
                        </Paragraph>
                        <Paragraph 
                            displayFlex={false} 
                            size="small"
                            style={{ color: 'white' }}
                            className="shrink-0">
                            {history.linesCleared}
                        </Paragraph>
                    </div>
                    <div className="list-item w-full px-2 py-4">
                        <Paragraph 
                            displayFlex={false} 
                            size="small"
                            style={{ color: 'white' }}
                            className="shrink-0">
                            TETRIS SCORED
                        </Paragraph>
                        <Paragraph 
                            displayFlex={false} 
                            size="small"
                            style={{ color: 'white' }}
                            className="shrink-0">
                            {history.tetrisScored}
                        </Paragraph>
                    </div>
                </div>
            ) : (
                <div className="list-item-2 w-full p-5">
                <Paragraph 
                displayFlex={false} 
                size="small">
                    NO STATISTICS YET!
                    GO PLAY SOME GAMES!            
                </Paragraph>

                </div>
            )}
            </div>
        </div>
    );
};

export default UserScore;
