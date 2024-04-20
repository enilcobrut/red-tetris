'use client'
import React, { createContext, useContext, useState } from 'react';

const defaultContext = {
  username: '',
  setUsername: () => {}
};

const UserContext = createContext(defaultContext);

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [username, setUsername] = useState('');

  return (
    <UserContext.Provider value={{ username, setUsername }}>
      {children}
    </UserContext.Provider>
  );
};
