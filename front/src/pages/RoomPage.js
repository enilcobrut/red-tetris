import React, { useEffect, useRef, useState } from 'react';
import BackgroundAnimation from '../components/BackgroundAnimation';
import Paragraph from '../components/Paragraph';
import GameCanva from '../components/game/GameCanva';
import { useRoom } from '../context/RoomContext';
import {  useSelector } from 'react-redux';

const RoomPage = () => {
    const { socket } = useSelector(state => state.socket);
    const { roomInfo } = useRoom();
    const hasRequested = useRef(false);
    const [spectrums, setSpectrums] = useState({});
    const username = useSelector(state => state.user.username);  // Utilisez useSelector pour obtenir l'username

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

    

useEffect(() => {

  if (socket) {

    const handleSpectrumUpdate = (data) => {
      console.log("Spectrum update received:", data);
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
    <div className="flex items-center justify-center p-10 h-full w-full">
      <BackgroundAnimation />
      <div className='flex flex-col mb-10 items-center justify-center h-full w-full'>
        <div className='flex flex-row gap-10 h-full w-full items-center justify-center'>
          <div className="game-container items-center justify-center">
            <Paragraph neon='magenta'>{username}</Paragraph>
            <GameCanva/>
          </div>
          <div className='flex flex-col'>
            <Paragraph neon='blue'>Room: {roomInfo.roomName}</Paragraph>
            {roomInfo.players.map((player, index) => (
              socket.id !== player.socketId && (
                <div key={index} className="player-spectrum">
                  <Paragraph>{player.name}</Paragraph>
                  {spectrums[player.socketId] && spectrums[player.socketId].length > 0 && (
  <div className="spectrum-grid">
    {Array.from({ length: spectrums[player.socketId][0].length }).map((_, colIndex) => ( // Générer des colonnes basées sur la longueur de la première rangée
      <div key={colIndex} className="grid-column">
        {spectrums[player.socketId].map((row, rowIndex) => (
          <div
            key={`${colIndex}-${rowIndex}`}
            className="grid-cell"
            style={{ backgroundColor: row[colIndex].color }} // Utiliser row[colIndex] pour accéder à la cellule correcte
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
        </div>
      </div>
    </div>
  );
}


export default RoomPage;
