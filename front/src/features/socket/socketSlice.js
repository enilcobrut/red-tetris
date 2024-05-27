import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import io from 'socket.io-client';

const initialState = {
  socket: null,
  isConnected: false,
  error: null
};

export const connectSocket = createAsyncThunk(
  'socket/connect',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Environment variable REACT_APP_SOCKET_URL:', process.env.REACT_APP_SOCKET_URL);
      const HOSTNAME = process.env.REACT_APP_SOCKET_URL || "localhost";
      const PORT = process.env.PORT || 3000;
      const socketUrl = `http://${HOSTNAME}:${PORT}`;
      const socket = io(socketUrl, { transports: ['websocket'] });
      return socket;
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const disconnectSocket = createAsyncThunk(
  'socket/disconnect',
  async (socket, { rejectWithValue }) => {
    try {
      socket.disconnect();
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(connectSocket.fulfilled, (state, action) => {
        state.socket = action.payload;
        state.isConnected = true;
      })
      .addCase(connectSocket.rejected, (state, action) => {
        state.error = action.payload;
        state.isConnected = false;
      })
      .addCase(disconnectSocket.fulfilled, (state) => {
        state.socket = null;
        state.isConnected = false;
      });
  }
});

export const emitEvent = createAsyncThunk(
  'socket/emitEvent',
  async ({ event, data }, { getState }) => {
    const { socket } = getState().socket;
    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error("Socket not connected"));
      socket.emit(event, data, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || "An unknown error occurred"));
        }
      });
    });
  }
);

export default socketSlice.reducer;
