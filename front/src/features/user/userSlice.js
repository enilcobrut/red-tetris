import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  username: ''
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUsername: (state, action) => {
      state.username = action.payload;
    },
    clearUsername: state => {
      state.username = '';
    }
  }
});

export const { setUsername, clearUsername } = userSlice.actions;

export default userSlice.reducer;
