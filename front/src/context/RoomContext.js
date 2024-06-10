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
        if (!socket) return;
    
        const handleRoomUpdate = (roomData) => {
            console.log("Received room update:", roomData);
            setRoomInfo(prev => {
                if (prev.roomName === roomData.roomName && JSON.stringify(prev.players) === JSON.stringify(roomData.players)) {
                    return prev; // No need to update if nothing has changed
                }
                return roomData;
            });
            setIsOwner(roomData.ownerSocketId === socket.id);
        };
    
        // Listen for room updates
        socket.on('room_update', handleRoomUpdate);
        socket.on('room_update_journey', handleRoomUpdate);
    
        // Clean up when the component unmounts or socket changes
        return () => {
            socket.off('room_update', handleRoomUpdate);
            socket.off('room_update_journey', handleRoomUpdate);
        };
    }, [socket]);
    
    

    useEffect(() => {
        const handleGameStart = ({ room, url }) => {
            console.log('Current room info:', roomInfo);
            console.log("Players in room:", roomInfo.players.map(player => player.name));

            // Check if current user is included in the list of players
            if (!roomInfo.players.some(player => player.name === username)) {
                console.log(username);
                console.log("Current user not in room players list.");
                return;
            }
            // Check if all expected players are present
            if (room === roomInfo.roomName) {
                navigate(url);
            } else {
                console.log("Not all players are present yet.");
            }
        };

        if (socket) {
            socket.on('redirect_game', handleGameStart);

            return () => {
                socket.off('redirect_game', handleGameStart);
            };
        }
    }, [socket, roomInfo, navigate, username]);


    const resetRoomContext = () => {
        setRoomInfo({ roomName: '', players: [], owner: '', ownerSocketId: '' });
        setIsOwner(false);
        console.log("Room context has been reset.");
    };
    return (
        <RoomContext.Provider value={{ roomInfo, setRoomInfo, isOwner, resetRoomContext }}>
            {children}
        </RoomContext.Provider>
    );
};

export const useRoom = () => useContext(RoomContext);
