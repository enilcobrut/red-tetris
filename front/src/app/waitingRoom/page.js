'use client'
import React from 'react';
import { useRouter } from 'next/navigation'; // Correction de l'importation
import { useRoom } from '../context/RoomContext';
import { useUser } from '../context/UserContext';
import Button from '../components/Button';
import BackgroundAnimation from '../components/BackgroundAnimation';
import { useSocket } from '../context/SocketContext';

export default function Home() {
    const router = useRouter();
    const { roomInfo } = useRoom();
    const { username } = useUser();
    const { socket } = useSocket();

    const handleClick = () => {
        router.push('/');
    };

    const startGame = () => {
        if (roomInfo.roomName && username && username === roomInfo.owner) {
            console.log("start front");
            socket.emit('start_game', { room: roomInfo.roomName, username });
        } else {
            console.error('Les informations nécessaires pour démarrer le jeu ne sont pas disponibles.');
        }
    };
    
    

    return (
        <main className="flex min-h-screen items-center justify-center flex-col gap-10">
            <BackgroundAnimation/>
            <button onClick={handleClick} className="font">RED TETRIS</button>
            <div className="waiting-container">
            <div className='font-username'>Room: {roomInfo.roomName}</div>
            {roomInfo.players.map((player, index) => (
                <div className='font-players' key={index}>
                    {player.name}{player.isOwner ? " (owner)" : ""}
                </div>
            ))}
                {roomInfo.owner === username && <Button onClick={startGame} color='blue'>START</Button>}
            </div>
        </main>
    );
}

