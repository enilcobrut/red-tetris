import React, { useState } from 'react';
import Button from '../Button';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from '../Toast';
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
                toast({
                    title: "Error",
                    message: `${error.message}`,
                    type: "error",
                });
             //   alert(error.message);
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

    const handleClickJourney = () => {
        if (socket && username && roomName) {
            socket.emit('join_room_journey', { username, room: roomName });
    
            socket.once('room_update_journey', () => {
                navigate('/waitingRoom');
            });
    
            socket.once('join_error_journey', (error) => {
                toast({
                    title: "Error",
                    message: `${error.message}`,
                    type: "error",
                });
               // alert(error.message); // Display the error message using an alert
            });
        } else {
            toast({
                title: "Error",
                message: "Socket not connected, username or roomName is empty.",
                type: "error",
            });
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
            <div className='flex flex-row w-full gap-5 justify-between'>
                <Button onClick={handleClickJourney} color='blue'>JOURNEY</Button>
                <Button onClick={handleClick} color='blue'>CLASSIC</Button>
            </div>
        </div>
    );
};

export default CreateRoom;
