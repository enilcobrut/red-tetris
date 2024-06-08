import React, { useEffect, useRef, useState } from 'react';
import BackgroundAnimation from '../components/BackgroundAnimation';
import Paragraph from '../components/Paragraph';
import GameCanva from '../components/game/GameCanva';
import { useRoom } from '../context/RoomContext';
import {  useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const RoomPage = () => {
    const { socket } = useSelector(state => state.socket);
    const { roomInfo } = useRoom();
    const hasRequested = useRef(false);
    const [spectrums, setSpectrums] = useState({});
    const username = useSelector(state => state.user.username);  // Utilisez useSelector pour obtenir l'username
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]); // State to store logs
    const [remindingPlayer, setRemindingPlayer] = useState(0);
    // const audioRef = useRef(new Audio('/tetris.mp3'));
    // const [soundOn, setSoundOn] = useState(true);
    const audios = [
      { src: '/erika.mp3', icon: '/Lucie.png', playing: false },
      { src: '/erika.mp3', icon: '/Sasso.png', playing: false },
      { src: '/erika.mp3', icon: '/Celine.png', playing: false },
      { src: '/erika.mp3', icon: '/Titi.png', playing: false },
      { src: '/erika.mp3', icon: '/Riri.png', playing: false },
      { src: '/pizza.mp3', icon: '/Peiqi.png', playing: false },
      { src: '/tetris.mp3', icon: '/sound.png', playing: true }
    ];
      const [audioStates, setAudioStates] = useState(audios);


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
  }

useEffect(() => {

  if (socket) {

    const handleLogUpdate = (data) => {
      if (data.logs) {
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
  audioRefs.current.forEach((audio, index) => {
    if (audio.playing) {
      audio.ref.play().catch(error => console.error(`Error playing audio ${index}:`, error));
    }
  });

  return () => {
    audioRefs.current.forEach(audio => audio.ref.pause());
  };
}, []);

const toggleSound = (index) => {
  const newAudioStates = audioRefs.current.map((audio, idx) => {
    if (idx === index) {
      if (audio.playing) {
        // Si l'audio est déjà en train de jouer, on le met en pause.
        audio.ref.pause();
        return { ...audio, playing: false };
      } else {
        // Si l'audio est en pause, on arrête tous les autres et on joue celui-ci.
        audio.ref.play().catch(error => console.error(`Error playing audio ${idx}:`, error));
        return { ...audio, playing: true };
      }
    } else {
      // On met en pause tous les autres audios.
      audio.ref.pause();
      return { ...audio, playing: false };
    }
  });

  // Mettre à jour les références avec le nouvel état.
  audioRefs.current = newAudioStates;
  setAudioStates(newAudioStates);

};


return (
  <div className="flex flex-col h-full w-full gap-10">
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

        <div className='user-data-2'>
          <div className='flex flex-row space-between w-full'>
            <div className='flex flex-col gap-2 justify-center w-full'>
              <div className='font-tetris-blue'>SCORE: {gameData.score}</div>
              <div className='font-tetris-blue'>LINE: {gameData.linesCleared}</div>
              <div className='font-tetris-blue'>TETRIS: {gameData.tetrisScored}</div>
              <div className='font-tetris-blue'>LEVEL: {gameData.level}</div>
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
    <Paragraph neon='blue'>REMAINING PLAYER : {remindingPlayer} / {roomInfo.players.length}</Paragraph>

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
