// UserbackProvider.tsx
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import Userback from '@userback/widget';

interface UserbackProviderProps {
  children: React.ReactNode;
}

interface UserbackContextType {
  userback: any;
}

const UserbackContext = createContext<UserbackContextType>({ userback: null });

export const UserbackProvider: React.FC<UserbackProviderProps> = ({ children }) => {
  const [userback, setUserback] = useState<any>(null);
  const isDevelopment = import.meta.env.VITE_ENVIRONMENT === "development";
  useEffect(() => {
    if(isDevelopment) return;
    const usebackId = import.meta.env.VITE_USERBACK_ID||"";
    const init = async () => {
      try {
        const options = {
         
        };
        const instance = await Userback(usebackId, options);
 
        setUserback(instance);
      } catch (error) {
        // Userback initialization failed silently
      }
    };
    
    init();
  }, []);

  const contextValue = useMemo(() => ({ userback }), [userback]);


  return (
    <UserbackContext.Provider value={contextValue}>
      {children}
    </UserbackContext.Provider>
  );
};

export const useUserback = () => useContext(UserbackContext);



