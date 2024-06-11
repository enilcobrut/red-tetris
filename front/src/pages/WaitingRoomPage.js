import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackgroundAnimation from "../components/BackgroundAnimation";
import Button from '../components/Button';
import { useRoom } from '../context/RoomContext';
import { useDispatch, useSelector } from 'react-redux';
import { setRoomStatus, setInGame } from '../features/user/userSlice';  // Ensure both actions are imported
import { toast } from '../components/Toast';

const WaitingRoomPage = () => {
    const dispatch = useDispatch();

    const navigate = useNavigate();
    const { roomInfo } = useRoom();
    const username = useSelector(state => state.user.username);  // Utilisez useSelector pour obtenir l'username
    const { socket, isConnected, error } = useSelector(state => state.socket);
    const isInGame = useSelector(state => state.user.isInGame);  // Access the isInGame state


    useEffect(() => {
          if (!isConnected || error) {
            toast({
                title: "Connection Error",
                message: "Socket is not connected or an error occurred. Redirecting to homepage.",
                type: "error",
                });
            navigate('/');
          }
        if (roomInfo.roomName) {
            dispatch(setRoomStatus({ isInRoom: true, roomName: roomInfo.roomName }));
        }

        if (isInGame) {
            socket.emit('leave_room', { room: roomInfo.roomName, username: username });
            dispatch(setRoomStatus({ isInRoom: false, roomName: '' }));  
            dispatch(setInGame(false));          
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
        }, [socket, isConnected, error, navigate, roomInfo]);



    const startGame = () => {
        if (roomInfo.roomName && username && username === roomInfo.owner) {
            socket.emit('redirect_game', { room: roomInfo.roomName, username });
        } else {
            toast({
                title: "Game Start Error",
                message: "The necessary information to start the game is not available.",
                type: "error",
            });
        }
    };

    const leaveGame = () => {
        socket.emit('leave_room', { room: roomInfo.roomName, username: username });
        dispatch(setRoomStatus({ isInRoom: false, roomName: '' }));

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
