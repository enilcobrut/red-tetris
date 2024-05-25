// import React, { useState , useEffect } from 'react';
// import Button from '../Button';
// import { useNavigate } from 'react-router-dom';
// import { useSelector, useDispatch } from 'react-redux';
// import { emitEvent } from '../../features/socket/socketSlice';
// import { updateRoomInfo } from '../../features/room/roomSlice';  // Corrected import
// const CreateRoom = ({ className }) => {
//     const navigate = useNavigate();
//     const dispatch = useDispatch();
//     const { isConnected, socket } = useSelector((state) => state.socket);
//     const [localRoomName, setLocalRoomName] = useState('');
//     const username = useSelector(state => state.user.username);

//     useEffect(() => {
//         // Listen for room updates from the server
//         const handleRoomUpdate = (roomData) => {
//             dispatch(updateRoomInfo(roomData));  // Update the Redux state with the data from the server
//             navigate('/waitingRoom');
//         };

//         socket.on('room_update', handleRoomUpdate);

//         return () => {
//             socket.off('room_update', handleRoomUpdate);
//         };
//     }, [dispatch, socket, navigate]);

//     const handleInputChange = (e) => {
//         setLocalRoomName(e.target.value);
//     };

//     const handleClick = () => {
//         if (isConnected && username && localRoomName) {
//             // Emit socket event to join/create the room
//             dispatch(emitEvent({
//                 event: 'join_room',
//                 data: { username, room: localRoomName }
//             }));
//         } else {
//             console.error("Socket not connected, username or roomName is empty.");
//         }
//     };

//     return (
//         <div className={`username-container ${className}`}>
//             <div className='font-username'>CREATE / JOIN ROOM</div>
//             <input
//                 type="text"
//                 placeholder="Enter a room name"
//                 name="roomName"
//                 className="input-username"
//                 value={localRoomName}
//                 onChange={handleInputChange}
//             />
//             <Button onClick={handleClick} color='blue'>START</Button>
//         </div>
//     );
// };

// export default CreateRoom;


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
