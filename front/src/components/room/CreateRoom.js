import React, { useState } from 'react';
import Button from '../Button';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';


const CreateRoom = ({ className }) => {
    const navigate = useNavigate();
    const {  socket } = useSelector((state) => state.socket);
    const username = useSelector(state => state.user.username);


    const [roomName, setRoomName] = useState('');

    // Conditional destructuring to handle cases where contexts might be null

    const handleInputChange = (e) => {
        setRoomName(e.target.value);
    };

    const handleClick = () => {
        if (socket && username && roomName) {
            socket.emit('join_room', { username, room: roomName });
            navigate('/waitingRoom');
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
