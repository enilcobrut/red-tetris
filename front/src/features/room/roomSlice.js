import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    roomName: '',
    isOwner: false,
    players: [],
    owner: '',
    ownerSocketId: ''
};

const roomSlice = createSlice({
    name: 'room',
    initialState,
    reducers: {
        updateRoomInfo: (state, action) => {
            state.roomName = action.payload.roomName;
            state.players = action.payload.players;
            state.owner = action.payload.owner;
            state.ownerSocketId = action.payload.ownerSocketId;
            state.isOwner = action.payload.ownerSocketId === action.payload.currentUserSocketId;
        },
        clearRoomInfo: (state) => {
            state.roomName = '';
            state.isOwner = false;
            state.players = [];
            state.owner = '';
            state.ownerSocketId = '';
        }
    }
});

export const { updateRoomInfo, clearRoomInfo } = roomSlice.actions;

export default roomSlice.reducer;
