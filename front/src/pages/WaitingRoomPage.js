import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {  useSelector } from 'react-redux';
import BackgroundAnimation from "../components/BackgroundAnimation";
import Button from '../components/Button';
import { useRoom } from '../context/RoomContext';

const WaitingRoomPage = () => {
    
    const navigate = useNavigate();
    const { roomInfo } = useRoom();
    const username = useSelector(state => state.user.username);  // Utilisez useSelector pour obtenir l'username
    const { socket, isConnected, error } = useSelector(state => state.socket);


    useEffect(() => {
         console.log(roomInfo);
  
          if (!isConnected || error) {
            console.error("Socket is not connected or an error occurred", error);
            navigate('/');
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
        }, [socket, isConnected, error, navigate, roomInfo]);
    const startGame = () => {
        if (roomInfo.roomName && username && username === roomInfo.owner) {
            console.log("start front");
            socket.emit('redirect_game', { room: roomInfo.roomName, username });
        } else {
            console.error('Les informations nécessaires pour démarrer le jeu ne sont pas disponibles.');
        }
    };

    const leaveGame = () => {
        socket.emit('leave_room', { room: roomInfo.roomName, username: username });
    
        // Optionally navigate away immediately or wait for server confirmation
        navigate('/lobby');
    };
    



    
    

    return (
        <main className="flex min-h-screen items-center justify-center flex-col gap-10">
            <BackgroundAnimation/>
            <div onClick={() => navigate('/')} className="font-tetris">RED TETRIS</div>
            <div className="waiting-container">
            <div className='font-username'>Room: {roomInfo.roomName}</div>
            {roomInfo.players.map((player, index) => (
                <div className='font-players' key={index}>
                    {player.name}{player.isOwner ? " (owner)" : ""}
                </div>
            ))}

            <div className='flex flex-row gap-10 items-center justify-center'>
                {roomInfo.owner === username &&
                <Button onClick={startGame} color='blue'>START</Button>}
                <Button onClick={leaveGame} color='blue'>LEAVE</Button>
            </div>
            </div>
        </main>
    );
}

export default WaitingRoomPage;
