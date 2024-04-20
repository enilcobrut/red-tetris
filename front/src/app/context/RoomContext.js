'use client'
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';

const RoomContext = createContext();

export const RoomProvider = ({ children }) => {
    const { socket } = useSocket();
    const [roomInfo, setRoomInfo] = useState({ roomName: '', players: [] });

    useEffect(() => {
        if (socket) {
            const handleRoomUpdate = (roomData) => {
                setRoomInfo(roomData);
            };

            socket.on('room_update', handleRoomUpdate);

            return () => {
                socket.off('room_update', handleRoomUpdate);
            };
        }
    }, [socket]);

    return (
        <RoomContext.Provider value={{ roomInfo, setRoomInfo }}>
            {children}
        </RoomContext.Provider>
    );
};

export const useRoom = () => useContext(RoomContext);
