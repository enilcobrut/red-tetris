import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { connectSocket, disconnectSocket } from './features/socket/socketSlice';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';

import LobbyPage from './pages/LobbyPage';
import HomePage from './pages/HomePage';
import WaitingRoomPage from './pages/WaitingRoomPage';
import RoomPage from './pages/RoomPage';


import { RoomProvider } from './context/RoomContext';
import { Toaster } from 'react-hot-toast';

function App() {
  const dispatch = useDispatch();
  //const isConnected = useSelector(state => state.socket.isConnected);

  useEffect(() => {
    dispatch(connectSocket());
    return () => {
      dispatch(disconnectSocket());
    };
  }, [dispatch]);

  return (
    <Router>
        <RoomProvider>
        <div style={{ zIndex: 9999 }}>
					<Toaster position='bottom-right' />
				</div>
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/waitingRoom" element={<WaitingRoomPage />} />
          <Route path="/:room/:player_name" element={<RoomPage />} />
        </Routes>
      </RoomProvider>
    </Router>
  );

}

export default App;
