'use client'
import React, { useEffect, useRef } from 'react';
import BackgroundAnimation from '../../components/BackgroundAnimation';
import Paragraph from '@/app/components/Paragraph';
import GameCanva from '@/app/components/game/GameCanva';
import { useRoom } from '@/app/context/RoomContext';
import { useSocket } from '@/app/context/SocketContext';  // Assurez-vous d'avoir accès au socket via un contexte ou un hook similaire
import { useUser } from '@/app/context/UserContext';

export default function Home() {
  const { socket } = useSocket();
  const { roomInfo } = useRoom();
  const hasRequested = useRef(false);
  const  { username } =  useUser();

  useEffect(() => {
    console.log("Socket:", socket);
    console.log("Username:", username);
    console.log("Room Name:", roomInfo.roomName);
    console.log("Has Requested:", hasRequested.current);

    if (socket && username && roomInfo.roomName && !hasRequested.current) {
        console.log("Requesting initial pieces for the game.");
        socket.emit('request_pieces', { username, room: roomInfo.roomName });
        hasRequested.current = true;
    }
}, [socket, username, roomInfo.roomName]);



    const handleClick = () => {
        router.push('/');
    };  
    
  return (
    <div className="flex items-center justify-center p-10 h-full w-full">
      <BackgroundAnimation />
      <div className='flex flex-col mb-10 items-center justify-center h-full w-full'>
        <div className='flex flex-row gap-10 h-full w-full items-center justify-center'>
          <div className="game-container items-center justify-center">
            <Paragraph neon='magenta'>username {username}</Paragraph>
            <GameCanva/>
          </div>
          <div className='flex flex-col'>
            <Paragraph neon='blue'>Room: {roomInfo.roomName}</Paragraph>
            {roomInfo.players.map((player, index) => (
                            <Paragraph key={index}>{player.name}</Paragraph>
                        ))}
          </div>
        </div>
      </div>
    </div>
  );
}
