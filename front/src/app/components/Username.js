'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from './Button';
import { useSocket } from '../context/SocketContext';
import { useUser } from '../context/UserContext';

const Username = () => {
    const router = useRouter();
    const socketContext = useSocket();
    const { setUsername } = useUser();
    const [localUsername, setLocalUsername] = useState('');
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        setLocalUsername(e.target.value);
    };

    const handleClick = async () => {
        console.log("click");
        if (localUsername && socketContext?.socket && socketContext.isConnected) {
            socketContext.socket.emit('validate_username', { username: localUsername }, (response) => {
                if (response.success) {
                    if (response.username) {
                        setUsername(response.username);
                        router.push('/home');
                    } else {
                        setError("Username is missing in the server response.");
                    }
                } else {
                    setError(response.error || "An unknown error occurred.");
                }
            });
        } else {
            setError("Please ensure a valid username and that the socket is connected.");
        }
    };

    return (
        <div className="username-container">
            <div className='font-username'>USERNAME</div>
            <input
                type="text"
                placeholder="Enter an username"
                name="username"
                className="input-username"
                value={localUsername}
                onChange={handleInputChange}
            />
            {error && <div className="error-message">{error}</div>}
            <Button onClick={handleClick} color='blue'>Next</Button>
        </div>
    );
};

export default Username;
