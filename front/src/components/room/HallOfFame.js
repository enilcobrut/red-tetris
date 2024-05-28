import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Paragraph from '../Paragraph';
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
            <div className='font-username-2 mb-5'>HALL OF FAME</div>
            {data.length > 0 ? (
                <div className="list-container w-full overflow-y-auto pr-2">  {/* Add the list-container class here */}
                        {data.map((item, index) => (
                            <div key={index} className="list-item w-full px-2 py-4">  {/* Add the list-item class here */}
                                <Paragraph 
                                    displayFlex={false} 
                                    size="small"
                                    style={{ color: 'white' }}
                                    className="shrink-0">
                                   {index + 1}
                                </Paragraph>
                                <Paragraph 
                                    displayFlex={false} 
                                    size="small"
                                    style={{ color: 'white' }}
                                    className="shrink-0">
                                    {item.username}    
                                </Paragraph>                                
                                  <Paragraph 
                                    displayFlex={false} 
                                    size="small"
                                    style={{ color: 'white' }}
                                    className="shrink-0">
                                    {item.score}    
                                </Paragraph> 
                            </div>
                        ))}
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );

}

export default HallOfFame;
