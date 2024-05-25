import { configureStore } from '@reduxjs/toolkit';
import socketReducer from '../features/socket/socketSlice';
import userReducer from '../features/user/userSlice';
import roomReducer from '../features/room/roomSlice';

export const store = configureStore({
  reducer: {
    socket: socketReducer,
    user: userReducer,
    room: roomReducer,
  },
});
