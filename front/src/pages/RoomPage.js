import React, { useEffect, useRef, useState } from 'react';
import BackgroundAnimation from '../components/BackgroundAnimation';
import Paragraph from '../components/Paragraph';
import GameCanva from '../components/game/GameCanva';
import { useRoom } from '../context/RoomContext';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setRoomStatus } from '../features/user/userSlice';
import { setInGame } from '../features/user/userSlice';
const RoomPage = () => {
    const { socket } = useSelector(state => state.socket);
    const { roomInfo } = useRoom();
    const hasRequested = useRef(false);
    const [spectrums, setSpectrums] = useState({});
    const username = useSelector(state => state.user.username);  // Utilisez useSelector pour obtenir l'username
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]); // State to store logs
    const [remindingPlayer, setRemindingPlayer] = useState(0);
    const [currentPiece, setCurrentPiece] = useState(null);
    const [hasInteracted, setHasInteracted] = useState(false); // Track user interaction

    const [initialPlayersCount, setInitialPlayersCount] = useState(0); // Ajout d'une nouvelle variable d'état

    const dispatch = useDispatch();

    useEffect(() => {
      dispatch(setInGame(true));

      return () => {
          dispatch(setInGame(false));
      };
  }, [dispatch]);

    useEffect(() => {
      if (roomInfo && roomInfo.players) {
          setInitialPlayersCount(roomInfo.players.length);
      }
  }, []); 



    useEffect(() => {
      if (socket) {

      socket.on('next_piece', (piece) => {
        setCurrentPiece(piece);
      });
      return () => socket.off('next_piece');
    }
    }, [socket]);

    
    // const audioRef = useRef(new Audio('/tetris.mp3'));
    // const [soundOn, setSoundOn] = useState(true);
    const audios = [
      { src: '/lucie.mp3', icon: '/Lucie.png', playing: false },
      { src: '/sasso.mp3', icon: '/Sasso.png', playing: false },
      { src: '/erika.mp3', icon: '/Celine.png', playing: false },
      { src: '/titi.mp3', icon: '/Titi.png', playing: false },
      { src: '/riri.mp3', icon: '/Riri.png', playing: false },
      { src: '/peiqi.mp3', icon: '/Peiqi.png', playing: false },
      { src: '/tetris.mp3', icon: '/sound.png', playing: true }
    ];
      const [audioStates, setAudioStates] = useState(audios);
      const renderPiece = (piece) => {
        if (!piece) return null;
      
        const containerStyle = {
          display: 'inline-block',
          border: '1px solid #333' // Bordure optionnelle pour visualiser le contour de la pièce entière
        };
      
        const rowStyle = {
          display: 'flex'
        };
      
        const cellStyle = {
          width: '30px',
          height: '30px',
          display: 'inline-block',
          backgroundColor: 'transparent', // Fond par défaut transparent
          border: '1px solid transparent' // Bordure transparente par défaut
        };
        const filledCellStyle = {
          ...cellStyle,
          border: '1px solid #FFFFFF',
          borderRadius: '4px',
          boxShadow: `inset 0 0 10px rgba(255, 255, 255, 0.8),
                      inset 0 0 20px rgba(255, 255, 255, 0.1),
                      0 0 5px #000000`
        };
      
        return (
          <div>
            {piece.shape.map((row, rowIndex) => (
              <div key={rowIndex} style={rowStyle}>
          {row.map((cell, cellIndex) => (
            <div key={cellIndex} style={cell ? { ...filledCellStyle, backgroundColor: piece.color } : cellStyle}></div>
          ))}
              </div>
            ))}
          </div>
        );
      };
      
    


    const audioRefs = useRef(audios.map(audio => ({
      ...audio,
      ref: new Audio(audio.src)
    })));

    const [gameData, setGameData] = useState({
      score: 0,
      linesCleared: 0,
      tetrisScored: 0,
      level: 1
    });

    const displayMode = roomInfo.players.length === 1 ? 'SINGLE PLAYER' : 'MULTIPLAYER';

  useEffect(() => {
    console.log("Socket:", socket);
    console.log("Username:", username);
    console.log("Room Name:", roomInfo.roomName);
    console.log("Has Requested:", hasRequested.current);

    if (socket && username === roomInfo.owner && roomInfo.roomName && !hasRequested.current) {
        console.log("Requesting initial pieces for the game.");
        socket.emit('game_started', { username, room: roomInfo.roomName });
        hasRequested.current = true;
    }
}, [socket, username, roomInfo.roomName, roomInfo.owner]);

  const handleClick = () => {
    navigate('/lobby');
    socket.emit('leave_game', { username, room: roomInfo.roomName });
    dispatch(setRoomStatus({ isInRoom: false, roomName: '' }));
    dispatch(setInGame(false));  
  }

useEffect(() => {

  if (socket) {

    const handleLogUpdate = (data) => {
      console.log("event from back LOGS");
      if (data.logs && data.roomName === roomInfo.roomName) {
          setLogs(data.logs);
      }
      if (data.remindingPlayer !== undefined) {
          setRemindingPlayer(data.remindingPlayer);
      }
      else {
        setRemindingPlayer(roomInfo.players.length);
      }
  };

  socket.on('log_update', handleLogUpdate);

  const handleLinesCleared = (data) => {
    console.log('Received lines cleared data:', data);
    setGameData({
      score: data.score,
      linesCleared: data.linesCleared,
      tetrisScored: data.tetrisScored,
      level: data.level
    });
  };

  socket.on('lines_cleared', handleLinesCleared);

    const handleSpectrumUpdate = (data) => {
      setSpectrums(prev => ({
        ...prev,
        [data.playerSocketId]: data.spectrumGrid
      }));
    };

    socket.on('update_spectrums', handleSpectrumUpdate);

    return () => {
      socket.off('update_spectrums', handleSpectrumUpdate);
      socket.off('log_update', handleLogUpdate);
    }
  }
}, [socket]);




useEffect(() => {
  if (hasInteracted) { // Ensure playback only starts after user interaction
    audioRefs.current.forEach((audio, index) => {
      if (audio.playing) {
        audio.ref.loop = true;
        audio.ref.play().catch(error => console.error(`Error playing audio ${index}:`, error));
      }
    });

    return () => {
      audioRefs.current.forEach(audio => audio.ref.pause());
    };
  }
}, [hasInteracted]);

const toggleSound = (index) => {
  const newAudioStates = audioRefs.current.map((audio, idx) => {
    if (idx === index) {
      // If the selected audio file is currently playing, pause it and set playing to false
      if (audio.playing) {
        audio.ref.pause();
        return { ...audio, playing: false };
      } else {
        // If the selected audio file is currently not playing, start playing it in a loop
        audio.ref.loop = true;
        audio.ref.play().catch(error => console.error(`Error playing audio ${idx}:`, error));
        return { ...audio, playing: true };
      }
    } else {
      // Pause all other audio files
      audio.ref.pause();
      return { ...audio, playing: false };
    }
  });

  // Update the references with the new state
  audioRefs.current = newAudioStates;
  setAudioStates(newAudioStates);

};


return (
  <div className="flex flex-col h-full w-full gap-10" onClick={() => setHasInteracted(true)}> {/* Add onClick to capture user interaction */}
    <div className="flex items-center justify-between p-10 h-20"> {/* Nav Bar with minimal height */}
      <div role='button' className='button-leave' onClick={handleClick}>
        <Paragraph neon='blue'>LEAVE</Paragraph>
      </div>
      <div className='font-tetris-2'>{displayMode}</div>
      <div className='flex flex-row gap-5'>
      {audioStates.map((audio, index) => (
  <img
    key={audio.src}
    className={`cursor-pointer h-10 ${!audio.playing ? 'opacity-30' : ''}`}
    src={audio.icon}
    alt={`${audio.src} Icon`}
    onClick={() => toggleSound(index)}
    style={{ cursor: 'd-pointer' }}
  />
))}


    </div>
    </div>
    <BackgroundAnimation />
    <div className='flex justify-center items-center w-full h-full'>
    <div className='game-layout'>
      <div className='user-data User-Data'>
        <div className='font-tetris-3'>{username}</div>

        <div className='user-data-stat min-he'>
          <div className='flex flex-row items-center justify-around gap-10 w-full'>
            <div className='flex flex-col gap-2 justify-center'>
              <div className='font-tetris-blue'>SCORE: {gameData.score}</div>
              <div className='font-tetris-blue'>LINE: {gameData.linesCleared}</div>
              <div className='font-tetris-blue'>TETRIS: {gameData.tetrisScored}</div>
              <div className='font-tetris-blue'>LEVEL: {gameData.level}</div>
            </div>
            <div className='flex items-center justify-center'>
              {renderPiece(currentPiece)}
            </div>

          </div>
        </div>

      </div>
      <div className='log Logs'>
        <div className='font-username-2'>LOGS</div>

        <div className='user-data-2'>
        {logs.map((log, index) => (
                        <div key={index}>
                          <Paragraph displayFlex={false}>{log}</Paragraph></div> // Display each log entry
                    ))}

        </div>


      </div>
      <div className='Game-Canva flex items-center justify-center'>
        <div className="game-container">
          <Paragraph neon='magenta'>{roomInfo.roomName}</Paragraph>
          <GameCanva />
        </div>
      </div>




      <div className='flex flex-col gap-5 Spectrums'>
            {roomInfo.players.length === 1 ? (
                // Display an image if there is only one player.
                <img src="/jinx.jpg" alt="Jinx" className="h-50"/>
            ) : (
                // Otherwise, display the player list and their spectrums.
<>
    <Paragraph neon='blue'>REMAINING PLAYER : {remindingPlayer} / {initialPlayersCount}</Paragraph>

    <div className='spectrum-player h-full'>
        {roomInfo.players.map((player, index) => {
            // Afficher pour tous les joueurs sauf le joueur connecté
            if (socket.id !== player.socketId) {
                return (
                    <div key={index} className="player-container">
                        <Paragraph>{player.name}</Paragraph>
                        <div className="game-spectrum">
                            {/* Vérifie si le joueur a des données de spectrums disponibles */}
                            {spectrums[player.socketId] && spectrums[player.socketId].length > 0 ? (
                                spectrums[player.socketId][0].map((_, colIndex) => (
                                    <div key={colIndex} className="grid-column">
                                        {spectrums[player.socketId].map((row, rowIndex) => (
                                            <div
                                                key={`${colIndex}-${rowIndex}`}
                                                className="grid-cell-spectrum"
                                                style={{ backgroundColor: row[colIndex].color }}
                                            />
                                        ))}
                                    </div>
                                ))
                            ) : (
                                // Afficher une grille vide si aucune donnée n'est disponible
                                Array.from({ length: 10 }).map((_, colIndex) => (
                                    <div key={colIndex} className="grid-column">
                                        {Array.from({ length: 20 }).map((_, rowIndex) => (
                                            <div
                                                key={`${colIndex}-${rowIndex}`}
                                                className="grid-cell-spectrum"
                                                style={{ backgroundColor: "#eeeeee" }} // Couleur de fond pour les cellules vides
                                            />
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );
            } else {
                return null; // Ne rien afficher si le joueur est celui connecté
            }
        })}
    </div>
</>
            )}
        </div>

      </div>
      </div>
      </div>
);

}


export default RoomPage;
