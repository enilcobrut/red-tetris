import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {  useDispatch,  useSelector } from 'react-redux';
import BackgroundAnimation from "../components/BackgroundAnimation";
import UserScore from '../components/room/UserScore';
import CreateRoom from '../components/room/CreateRoom';
import RoomList from '../components/room/RoomList';
import HallOfFame from '../components/room/HallOfFame';
import { setRoomStatus } from '../features/user/userSlice';
import { toast } from '../components/Toast';

const LobbyPage = () => {
    const navigate = useNavigate();
    const { socket, isConnected, error } = useSelector(state => state.socket);
    const username = useSelector(state => state.user.username);  // Utilisez useSelector pour obtenir l'username
    const isInRoom = useSelector(state => state.user.isInRoom);  // Access the isInRoom state
    const roomName = useSelector(state => state.user.roomName); // Access the roomName state
    const dispatch = useDispatch();

    useEffect(() => {

        if (!isConnected || error) {
          toast({
            title: "Connection Error",
            message: "No socket connection. Please check your network and try again.",
            type: "error",
        });

          navigate('/');
        }
        if (isInRoom) {
          socket.emit('leave_room', { room: roomName, username: username });
          dispatch(setRoomStatus({ isInRoom: false, roomName: '' }));  
          console.log("The user is currently in a room.");
      }
    
        const handleDisconnect = () => {
          console.log("Disconnected from server, redirecting to homepage");
          navigate('/');
        };
    
        // Listen for socket disconnection
        socket?.on('disconnect', handleDisconnect);
    
        // Cleanup this effect by removing the event listener
        return () => {
          socket?.off('disconnect', handleDisconnect);
        };
      }, [socket, isConnected, error, navigate]);
    
  return (
    <main className="flex min-h-screen items-center justify-center flex-col gap-10">
      <BackgroundAnimation/>
      <div onClick={() => navigate('/')} className="font-tetris">RED TETRIS</div>
      <div className="font-2">Welcome {username || "No Username"}!</div>
      <div className='room-layout'>
        <UserScore className='User-Scores'/>
        <CreateRoom className='Create-Room'/>
        <RoomList className='Room-List'/>
        <HallOfFame className='HallOfFame'/>
      </div>
    </main>
  );
};

export default LobbyPage;
