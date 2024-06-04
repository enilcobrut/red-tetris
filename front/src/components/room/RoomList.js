import React, { useEffect } from 'react';
import {  useSelector } from 'react-redux';
import Button from '../Button';
import Paragraph from '../Paragraph';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';


const RoomList = ({ className }) => {
    const navigate = useNavigate();

    const { socket  } = useSelector(state => state.socket);
    const username = useSelector(state => state.user.username);
    const [canNavigate, setCanNavigate] = useState(true);
    const [rooms, setRooms] = useState([]);

    useEffect(() => {
            if (socket) {
            socket.emit('sendAllActiveRooms');

            socket.on('activeRooms', (data) => {
                setRooms(data.rooms);
            });
        }
        return () => {
            socket.off('activeRooms');
        };
    }, [rooms]);

    const handleClick = (roomName) => {
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
        <div className={`halloffame ${className}`}>
            <div className='font-username'>ROOM LIST</div>
                <div className="list-container w-full overflow-y-auto pr-2">  {/* Add the list-container class here */}

                    {rooms.map((room, index) => (
                        <div key={index} className="list-item w-full px-2 py-4">  {/* Add the list-item class here */}
                                <Paragraph 
                                    displayFlex={false} 
                                    size="small"
                                    style={{ color: 'white' }}
                                    className="shrink-0">
                                   {room}
                                </Paragraph>
                                <div role='button' className='button-join' onClick={() => handleClick(room)}>JOIN</div>
                        </div>
                    ))}
                </div>

        </div>
    );

}

export default RoomList;
