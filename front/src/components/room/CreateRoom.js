import React, { useState } from 'react';
import Button from '../Button';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const CreateRoom = ({ className }) => {
    const navigate = useNavigate();
    const { socket } = useSelector(state => state.socket);
    const username = useSelector(state => state.user.username);
    const [canNavigate, setCanNavigate] = useState(true);
    const [roomName, setRoomName] = useState('');

    const handleInputChange = (e) => {
        setRoomName(e.target.value);
    };

    const handleClick = () => {
        if (socket && username && roomName) {
            const handleJoinError = (error) => {
                setCanNavigate(false);
                alert(error.message);
                socket.off('join_error', handleJoinError);
            };

            socket.on('join_error', handleJoinError);

            socket.emit('join_room', { username, room: roomName });
            setCanNavigate(true);

            socket.once('room_update', () => {
                if (canNavigate) {
                    navigate('/waitingRoom');
                    socket.off('join_error', handleJoinError);
                }
            });
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
