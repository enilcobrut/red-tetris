'use client'
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';
import { useUser } from './UserContext';
import { useRouter } from 'next/navigation';

const RoomContext = createContext();

export const RoomProvider = ({ children }) => {
    const { socket } = useSocket();
    const { username } = useUser();  // Assurez-vous d'extraire username correctement ici
    const router = useRouter();
    const [roomInfo, setRoomInfo] = useState({ roomName: '', players: [], owner: '', ownerSocketId: '' });
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        if (socket) {
            const handleRoomUpdate = (roomData) => {
                setRoomInfo(roomData);
                setIsOwner(roomData.ownerSocketId === socket.id);
            };
            console.log("www");
            socket.on('room_update', handleRoomUpdate);

            return () => {
                socket.off('room_update', handleRoomUpdate);
            };
        }
    }, [socket]);

    useEffect(() => {
        const handleGameStart = ({ room, url }) => {
            if (room === roomInfo.roomName) {
                router.push(url);
            }
        };

        if (socket) {
            socket.on('game_started', handleGameStart);

            return () => {
                socket.off('game_started', handleGameStart);
            };
        }
    }, [socket, roomInfo.roomName, router, username]);  // Inclure username dans les dépendances

    return (
        <RoomContext.Provider value={{ roomInfo, setRoomInfo, isOwner }}>
            {children}
        </RoomContext.Provider>
    );
};

export const useRoom = () => useContext(RoomContext);
