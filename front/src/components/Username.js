import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import { emitEvent } from '../features/socket/socketSlice';
import { setUsername } from '../features/user/userSlice';

const Username = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isConnected } = useSelector(state => state.socket);
    const [localUsername, setLocalUsername] = useState('');
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        setLocalUsername(e.target.value);
    };

    const handleClick = async () => {
        if (localUsername && isConnected) {
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
                    setError(response.error);
                }
            } catch (err) {
                setError('An error occurred while validating the username.');
            }
        } else {
            setError("Please ensure a valid username and that the socket is connected.");
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
            {error && <div className="error-message">{error}</div>}
            <Button onClick={handleClick} color='blue'>Next</Button>
        </div>
    );
};

export default Username;
