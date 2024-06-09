import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  username: '',
  isInRoom: false,
  roomName: '',
  isInGame: false  // Track in-game status
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUsername: (state, action) => {
      state.username = action.payload;
    },
    clearUsername: (state) => {
      state.username = '';
    },
    setRoomStatus: (state, action) => {
      state.isInRoom = action.payload.isInRoom;
      state.roomName = action.payload.roomName || '';
    },
    leaveRoom: (state) => {
      state.isInRoom = false;
      state.roomName = '';
    },
    setInGame: (state, action) => {
      state.isInGame = action.payload;
    },
    leaveGame: (state) => {
      state.isInGame = false;
    }
  }
});

// Correct export of all actions
export const { setUsername, clearUsername, setRoomStatus, leaveRoom, setInGame, leaveGame } = userSlice.actions;

export default userSlice.reducer;
