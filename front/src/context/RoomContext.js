import React, { createContext, useContext, useEffect, useState } from 'react';
import {  useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';


const RoomContext = createContext();

export const RoomProvider = ({ children }) => {
    const username = useSelector(state => state.user.username);  // Utilisez useSelector pour obtenir l'username
    const { socket } = useSelector(state => state.socket);
    const navigate = useNavigate();
    const [roomInfo, setRoomInfo] = useState({ roomName: '', players: [], owner: '', ownerSocketId: '' });
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        if (socket) {
            const handleRoomUpdate = (roomData) => {
                setRoomInfo(roomData);
                setIsOwner(roomData.ownerSocketId === socket.id);
            };
            socket.on('room_update', handleRoomUpdate);
            return () => {
                socket.off('room_update', handleRoomUpdate);
            };
        }
    }, [socket]);

    useEffect(() => {
        const handleGameStart = ({ room, url }) => {
            if (room === roomInfo.roomName) {
                navigate(url);
            }
        };

        if (socket) {
            socket.on('redirect_game', handleGameStart);

            return () => {
                socket.off('redirect_game', handleGameStart);
            };
        }
    }, [socket, roomInfo.roomName, navigate, username]); 

    

    return (
        <RoomContext.Provider value={{ roomInfo, setRoomInfo, isOwner }}>
            {children}
        </RoomContext.Provider>
    );
};

export const useRoom = () => useContext(RoomContext);