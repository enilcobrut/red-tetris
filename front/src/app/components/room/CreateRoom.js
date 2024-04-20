import React, { useState } from 'react';
import Button from '../Button';
import { useRouter } from 'next/navigation';
import { useSocket } from '../../context/SocketContext';
import { useUser } from '../../context/UserContext';

const CreateRoom = ({ className }) => {
    const router = useRouter();
    const socketContext = useSocket(); // Retrieve the entire socket context
    const userContext = useUser(); // Retrieve the entire user context
    const [roomName, setRoomName] = useState('');

    // Conditional destructuring to handle cases where contexts might be null
    const socket = socketContext?.socket;
    const username = userContext?.username;

    const handleInputChange = (e) => {
        setRoomName(e.target.value);
    };

    const handleClick = () => {
        if (socket && username && roomName) {
            socket.emit('join_room', { username, room: roomName });
            router.push('/waitingRoom');
        } else {
            console.error("Socket not connected, username or roomName is empty.");
        }
    };

    return (
        <div className={`username-container ${className}`}>
            <div className='font-username'>CREATE / JOIN ROOM</div>
            <input
                type="text"
                placeholder="Enter a room name"
                name="roomName"
                className="input-username"
                value={roomName}
                onChange={handleInputChange}
            />
            <Button onClick={handleClick} color='blue'>START</Button>
        </div>
    );
};

export default CreateRoom;
