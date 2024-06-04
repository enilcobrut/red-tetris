import React, { useEffect, useRef, useState } from 'react';
import BackgroundAnimation from '../components/BackgroundAnimation';
import Paragraph from '../components/Paragraph';
import GameCanva from '../components/game/GameCanva';
import { useRoom } from '../context/RoomContext';
import {  useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const RoomPage = () => {
    const { socket } = useSelector(state => state.socket);
    const { roomInfo } = useRoom();
    const hasRequested = useRef(false);
    const [spectrums, setSpectrums] = useState({});
    const username = useSelector(state => state.user.username);  // Utilisez useSelector pour obtenir l'username
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]); // State to store logs
    const [remindingPlayer, setRemindingPlayer] = useState(0);

    const [gameData, setGameData] = useState({
      score: 0,
      linesCleared: 0,
      tetrisScored: 0
    });


    const displayMode = roomInfo.players.length === 1 ? 'SINGLE PLAYER' : 'MULTIPLAYER';

  useEffect(() => {
    console.log("Socket:", socket);
    console.log("Username:", username);
    console.log("Room Name:", roomInfo.roomName);
    console.log("Has Requested:", hasRequested.current);

    if (socket && username === roomInfo.owner && roomInfo.roomName && !hasRequested.current) {
        console.log("Requesting initial pieces for the game.");
        socket.emit('game_started', { username, room: roomInfo.roomName });
        hasRequested.current = true;
    }
}, [socket, username, roomInfo.roomName, roomInfo.owner]);

  const handleClick = () => {
    navigate('/lobby');
    socket.emit('leave_game', { username, room: roomInfo.roomName });


  }

useEffect(() => {

  if (socket) {

    const handleLogUpdate = (data) => {
      if (data.logs) {
          setLogs(data.logs);
      }
      if (data.remindingPlayer !== undefined) {
          setRemindingPlayer(data.remindingPlayer);
      }
      else {
        setRemindingPlayer(roomInfo.players.length);
      }
  };

  socket.on('log_update', handleLogUpdate);

  const handleLinesCleared = (data) => {
    console.log('Received lines cleared data:', data);
    // Update local state with the received data
    setGameData({
      score: data.score,
      linesCleared: data.linesCleared,
      tetrisScored: data.tetrisScored
    });
  };

  socket.on('lines_cleared', handleLinesCleared);

    const handleSpectrumUpdate = (data) => {
      setSpectrums(prev => ({
        ...prev,
        [data.playerSocketId]: data.spectrumGrid
      }));
    };

    socket.on('update_spectrums', handleSpectrumUpdate);

    return () => {
      socket.off('update_spectrums', handleSpectrumUpdate);
      socket.off('log_update', handleLogUpdate);
    }
  }
}, [socket]);



return (
  <div className="flex flex-col h-full w-full gap-10">
    <div className="flex items-center justify-between p-10 h-20"> {/* Nav Bar with minimal height */}
      <div role='button' className='button-leave' onClick={handleClick}>
        <Paragraph neon='blue'>LEAVE</Paragraph>
      </div>
      <div className='font-tetris-2'>{displayMode}</div>
      <img className='h-10' src='/sound.png' alt='Sound Icon' /> {/* Assuming you have sound.png in your public/assets folder */}
    </div>
    <BackgroundAnimation />
    <div className='flex justify-center items-center w-full h-full'>
    <div className='game-layout'>
      <div className='user-data User-Data'>
        <div className='font-tetris-3'>{username}</div>

        <div className='user-data-2'>

          <div className='flex flex-row space-between w-full'>
            <div className='flex flex-col gap-2 justify-center w-full'>
              <div className='font-tetris-blue'>SCORE: {gameData.score}</div>
              <div className='font-tetris-blue'>LINE: {gameData.linesCleared}</div>
              <div className='font-tetris-blue'>TETRIS: {gameData.tetrisScored}</div>
            </div>

          </div>


        </div>

      </div>
      <div className='log Logs'>
        <div className='font-username-2'>LOGS</div>

        <div className='user-data-2'>
        {logs.map((log, index) => (
                        <div key={index}>
                          <Paragraph displayFlex={false}>{log}</Paragraph></div> // Display each log entry
                    ))}

        </div>


      </div>
      <div className='Game-Canva flex items-center justify-center'>
        <div className="game-container">
          <Paragraph neon='magenta'>{roomInfo.roomName}</Paragraph>
          <GameCanva />
        </div>
      </div>




      <div className='flex flex-col gap-5 Spectrums'>
            {roomInfo.players.length === 1 ? (
                // Display an image if there is only one player.
                <img src="/jinx-was-here.jpg" alt="Jinx" className="h-50"/>
            ) : (
                // Otherwise, display the player list and their spectrums.
<>
    <Paragraph neon='blue'>REMAINING PLAYER : {remindingPlayer} / {roomInfo.players.length}</Paragraph>

    <div className='spectrum-player h-full'>
        {roomInfo.players.map((player, index) => {
            // Afficher pour tous les joueurs sauf le joueur connecté
            if (socket.id !== player.socketId) {
                return (
                    <div key={index} className="player-container">
                        <Paragraph>{player.name}</Paragraph>
                        <div className="game-spectrum">
                            {/* Vérifie si le joueur a des données de spectrums disponibles */}
                            {spectrums[player.socketId] && spectrums[player.socketId].length > 0 ? (
                                spectrums[player.socketId][0].map((_, colIndex) => (
                                    <div key={colIndex} className="grid-column">
                                        {spectrums[player.socketId].map((row, rowIndex) => (
                                            <div
                                                key={`${colIndex}-${rowIndex}`}
                                                className="grid-cell-spectrum"
                                                style={{ backgroundColor: row[colIndex].color }}
                                            />
                                        ))}
                                    </div>
                                ))
                            ) : (
                                // Afficher une grille vide si aucune donnée n'est disponible
                                Array.from({ length: 10 }).map((_, colIndex) => (
                                    <div key={colIndex} className="grid-column">
                                        {Array.from({ length: 20 }).map((_, rowIndex) => (
                                            <div
                                                key={`${colIndex}-${rowIndex}`}
                                                className="grid-cell-spectrum"
                                                style={{ backgroundColor: "#eeeeee" }} // Couleur de fond pour les cellules vides
                                            />
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );
            } else {
                return null; // Ne rien afficher si le joueur est celui connecté
            }
        })}
    </div>
</>
            )}
        </div>

      </div>
      </div>
      </div>
);

}


export default RoomPage;
