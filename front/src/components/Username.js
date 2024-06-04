import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import { emitEvent } from '../features/socket/socketSlice';
import { setUsername } from '../features/user/userSlice';
import { toast } from './Toast'; // Assuming toast is properly imported

const Username = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isConnected } = useSelector(state => state.socket);
    const [localUsername, setLocalUsername] = useState('');

    const handleInputChange = (e) => {
        setLocalUsername(e.target.value);
    };

    const handleClick = async () => {
        if (!localUsername) {
            toast({
                title: "Error",
                message: "Please enter a username before proceeding.",
                type: "error",
            });
            return;
        }

        if (!isConnected) {
            toast({
                title: "Connection Error",
                message: "No socket connection. Please check your network and try again.",
                type: "error",
            });
            return;
        }

        try {
            const response = await dispatch(emitEvent({
                event: 'validate_username',
                data: { username: localUsername }
            })).unwrap();

            if (response.success) {
                const { username } = response;
                dispatch(setUsername(username));
                navigate('/lobby');
            } else {
                toast({
                    title: "Username Error",
                    message: response.error || "This username cannot be used.",
                    type: "error",
                });
            }
        } catch (err) {
                toast({
                title: "Validation Error",
                message: "An error occurred while validating the username. Please try again.",
                type: "error",
            });
        }
    };

    return (
        <div className="username-container">
            <div className='font-username'>USERNAME</div>
            <input
                type="text"
                placeholder="Enter a username"
                name="username"
                className="input-username"
                value={localUsername}
                onChange={handleInputChange}
            />
            <Button onClick={handleClick} color='blue'>Next</Button>
        </div>
    );
};

export default Username;
