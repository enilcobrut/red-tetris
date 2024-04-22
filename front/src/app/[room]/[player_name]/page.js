
'use client'
import React from 'react';
import BackgroundAnimation from '../../components/BackgroundAnimation';
import { useRouter } from 'next/navigation';
import Paragraph from '@/app/components/Paragraph';
import { useUser } from '@/app/context/UserContext';
import GameCanva from '@/app/components/game/GameCanva';
import { useRoom } from '@/app/context/RoomContext';

export default function Home() {
    const router = useRouter();
    const  { username } = useUser();
    const { roomInfo } = useRoom();


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