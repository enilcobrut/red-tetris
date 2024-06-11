import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import Paragraph from '../Paragraph';
import DropdownMenu from '../DropDownMenu';
import { toast } from '../Toast';

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
                if (Array.isArray(jsonData)) {
                    const standardizedData = jsonData.map(item => {
                        const keys = Object.keys(item);
                        const valueKey = keys.find(key => key !== 'username');  // Find the dynamic value key
                        return {
                            username: item.username,
                            value: item[valueKey]  // Standardize under 'value'
                        };
                    });
                    setData(standardizedData.slice(0, 10));
                } else {
                    toast({
                        title: "Error",
                        message: "Received data is not an array.",
                        type: "error",
                    });
                }
            };
            socket.emit('getData', { sort: leaderBoard });
            socket.on('data', handleData);
            return () => {
                if (socket) {
                    socket.off('data', handleData);
                }
            };
        }
    }, [socket, leaderBoard]);
    const handleClick = () => {
		setShowDropdown(!showDropdown);

	};




    // useEffect(() => {
    //     console.log(leaderBoard);

    //     socket.emit('getData', { sort: leaderBoard });

    // }, [leaderBoard]);


    return (
        <div className={`halloffame ${className}`}>
            <div className='flex flex-row gap-4 justify-center items-center'>
                <img onClick={handleClick} role='button' src="/arrow.png" alt="arrow" className="mb-5 h-4"/>
                <div className='font-username-hallOfFame mb-5'>HALL OF FAME - {leaderBoard}</div>
                <DropdownMenu isTranslate={false} show={showDropdown} onClose={() => setShowDropdown(false)} style={{ transform: 'translateX(-220px)' }}>
						<button   onClick={() => { setLeaderBoard('Score'); setShowDropdown(false); }} className="relative z-50 px-4 py-2 text-white hover:bg-gray-950 w-full">
							<Paragraph>
								Best Scores
							</Paragraph>
						</button>
                        <button   onClick={() => { setLeaderBoard('Scores'); setShowDropdown(false); }} className="relative z-50 px-4 py-2 text-white hover:bg-gray-950 w-full">
							<Paragraph>
								Best Player by Score
							</Paragraph>
						</button>
                        <button onClick={() => { setLeaderBoard('Played'); setShowDropdown(false);}} className="block z-50 block px-4 py-2 text-white hover:bg-gray-950 w-full">
							<Paragraph>
								Sort by Game Played
							</Paragraph>
						</button>
                        <button   onClick={() => { setLeaderBoard('Single'); setShowDropdown(false); }} className="relative z-50 px-4 py-2 text-white hover:bg-gray-950 w-full">
							<Paragraph>
								Sort by Single Player Game Played
							</Paragraph>
						</button>
                        <button onClick={() => { setLeaderBoard('Win'); setShowDropdown(false);}} className="block z-50 block px-4 py-2 text-white hover:bg-gray-950 w-full">
							<Paragraph>
								Sort by Multyplayer Game Won
							</Paragraph>
						</button>
                        <button onClick={() => { setLeaderBoard('Loss'); setShowDropdown(false);}} className="block z-50 block px-4 py-2 text-white hover:bg-gray-950 w-full">
							<Paragraph>
								Sort by Multyplayer Game Lost
							</Paragraph>
						</button>
						<button onClick={() => { setLeaderBoard('Tetris'); setShowDropdown(false); }} className="block z-50 block px-4 py-2 text-white hover:bg-gray-950 w-full">
							<Paragraph>
								Sort by Tetris Scored
							</Paragraph>
						</button>
                        <button onClick={() => { setLeaderBoard('Lines'); setShowDropdown(false);}} className="block z-50 block px-4 py-2 text-white hover:bg-gray-950 w-full">
							<Paragraph>
								Sort Lines cleared
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
                                    {item.value}    
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
