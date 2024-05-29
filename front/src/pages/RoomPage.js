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

    const displayMode = roomInfo.players.length === 1 ? 'SINGLE MODE' : 'MULTI MODE';

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

    const handleSpectrumUpdate = (data) => {
     // console.log("Spectrum update received:", data);
      setSpectrums(prev => ({
        ...prev,
        [data.playerSocketId]: data.spectrumGrid
      }));
    };

    socket.on('update_spectrums', handleSpectrumUpdate);

    return () => socket.off('update_spectrums', handleSpectrumUpdate);
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
        <div className='font-tetris-3'>{username} #RANK</div>

        <div className='user-data-2'>

          <div className='flex flex-row space-between'>
            <div className='flex flex-col gap-2 justify-center'>
              <div className='font-tetris-blue'>SCORE : 5479</div>
              <div className='font-tetris-blue'>LINE : 5</div>
              <div className='font-tetris-blue'>TETRIS : 1</div>
            </div>

          </div>


        </div>

      </div>
      <div className='log Logs'>
        <div className='font-username-2'>LOGS</div>

        <div className='user-data-2'>
          </div>


      </div>
      <div className="game-container items-center justify-center Game-Canva">
        <Paragraph neon='magenta'>{roomInfo.roomName}</Paragraph>
        <GameCanva />
      </div>




      <div className='flex flex-col h-full gap-5 Spectrums'>
            {roomInfo.players.length === 1 ? (
                // Display an image if there is only one player.
                <img src="/jinx-was-here.jpg" alt="Jinx" className="h-50"/>
            ) : (
                // Otherwise, display the player list and their spectrums.
                <>
                    <Paragraph neon='blue'>REMINDING PLAYER : {roomInfo.players.length}/18</Paragraph>
                    <div className='spectrum-player'>
                        {roomInfo.players.map((player, index) => (
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
                </>
            )}
        </div>

      </div>
      </div>
      </div>
);

}


export default RoomPage;