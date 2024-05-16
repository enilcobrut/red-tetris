'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import BackgroundAnimation from "../components/BackgroundAnimation";
import UserScore from '../components/room/UserScore';
import CreateRoom from '../components/room/CreateRoom';
import RoomList from '../components/room/RoomList';
import HallOfFame from '../components/room/HallOfFame';
import { useUser } from '../context/UserContext'; // Ensure this path is correct
import { useSocket } from '../context/SocketContext';
import { useEffect } from 'react';
const HomePage = () => {
  const router = useRouter();
  const { socket } = useSocket();
  const { username } = useUser();
  const handleClick = () => {
    router.push('/'); // Replace '/nextpage' with your chosen path
  };

  useEffect(() => {
    if (!socket) {
        router.push('/');
        console.error("Socket is not defined");
        return;
    }
    const handleDisconnect = () => {
      console.log("Game over, redirecting to homepage");
      router.push('/');
  };
  socket.on('handle_disconnect', handleDisconnect);


    return () => {
        socket.off('handle_disconnect', handleDisconnect);

    };
  }, [socket]);


  return (
    <main className="flex min-h-screen items-center justify-center p-10 flex flex-col gap-20">
      <BackgroundAnimation/>
      <button onClick={handleClick} className="font">RED TETRIS</button>
      <div className="font-2">WELCOME {username || "No Username"}</div>
      <div className='room-layout'>
        <UserScore className='User-Scores'/>
        <CreateRoom className='Create-Room'/>
        <RoomList className='Room-List'/>
        <HallOfFame className='HallOfFame'/>
      </div>
    </main>
  );
};

export default HomePage;
