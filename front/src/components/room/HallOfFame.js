import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import Paragraph from '../Paragraph';
import DropdownMenu from '../DropDownMenu';
const HallOfFame = ({ className }) => {
    const { socket } = useSelector(state => state.socket);
    const [data, setData] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [leaderBoard, setLeaderBoard] = useState('Score');
    const dropdownRef = useRef(null);


    const handleClickOutside = (event) => {
		if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
			setShowDropdown(false);
		}
	};

    useEffect(() => {
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [])


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

            socket.emit('getData', { sort: leaderBoard });


            socket.on('data', handleData);


            return () => {
                socket.off('data', handleData);
            };
        }
    }, [socket]);
    const handleClick = () => {
		setShowDropdown(!showDropdown);

	};

    // Log data whenever it changes
    useEffect(() => {
        console.log('Updated data:', data);
    }, [data]);



    return (
        <div className={`halloffame ${className}`}>
            <div className='flex flex-row gap-4 justify-center items-center'>
                <img onClick={handleClick} role='button' src="/arrow.png" alt="arrow" className="mb-5 h-4"/>
                <div className='font-username-hallOfFame mb-5'>HALL OF FAME - {leaderBoard}</div>
                <DropdownMenu isTranslate={false} show={showDropdown} onClose={() => setShowDropdown(false)} style={{ transform: 'translateX(-220px)' }}>
						<button   onClick={() => { setLeaderBoard('Score'); setShowDropdown(false); }} className="relative z-50 px-4 py-2 text-white hover:bg-gray-950 w-full">
							<Paragraph>
								Sort by Score
							</Paragraph>
						</button>
						<button onClick={() => { setLeaderBoard('Tetris'); setShowDropdown(false); }} className="block z-50 block px-4 py-2 text-white hover:bg-gray-950 w-full">
							<Paragraph>
								Sort by Tetris
							</Paragraph>
						</button>
                        <button onClick={() => { setLeaderBoard('Lines'); setShowDropdown(false);}} className="block z-50 block px-4 py-2 text-white hover:bg-gray-950 w-full">
							<Paragraph>
								Sort Lines cleared
							</Paragraph>
						</button>
                        <button onClick={() => { setLeaderBoard('Win'); setShowDropdown(false);}} className="block z-50 block px-4 py-2 text-white hover:bg-gray-950 w-full">
							<Paragraph>
								Sort by Game's Wins
							</Paragraph>
						</button>
                        <button onClick={() => { setLeaderBoard('Played'); setShowDropdown(false);}} className="block z-50 block px-4 py-2 text-white hover:bg-gray-950 w-full">
							<Paragraph>
								Sort by Game's Played
							</Paragraph>
						</button>
                        <button onClick={() => { setLeaderBoard('Loose'); setShowDropdown(false);}} className="block z-50 block px-4 py-2 text-white hover:bg-gray-950 w-full">
							<Paragraph>
								Sort by Game's Looses
							</Paragraph>
						</button>
					</DropdownMenu>

            </div>
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
