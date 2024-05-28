import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const HallOfFame = ({ className }) => {
    const { socket } = useSelector(state => state.socket);
    const [data, setData] = useState([]);

    useEffect(() => {
        if (socket) {


            
            console.log('Socket is connected:', socket.connected);

            const handleData = (jsonData) => {
                console.log('Data received:', jsonData);
                if (Array.isArray(jsonData)) {
                    setData(jsonData.slice(0, 10));
                } else {
                    console.error('Received data is not an array:', jsonData);
                }
            };

            socket.emit('getData');


            socket.on('data', handleData);


            return () => {
                socket.off('data', handleData);
            };
        }
    }, [socket]);

    // Log data whenever it changes
    useEffect(() => {
        console.log('Updated data:', data);
    }, [data]);

    return (
        <div className={`halloffame ${className}`}>
            <div className='font-username'>HALL OF FAME</div>
            {data.length > 0 ? (
                <ol>
                    {data.map((item, index) => (
                        <li key={index}>
                            Rank {index + 1}: {item.username} - {item.score}
                        </li>
                    ))}
                </ol>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
}

export default HallOfFame;
