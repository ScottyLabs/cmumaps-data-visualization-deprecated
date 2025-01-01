import React, { createContext } from "react";

export const FloorLevelsContext = createContext<string[]>([]);

interface Props {
  children: React.ReactNode;
  floorLevels: string[];
}

export const FloorLevelsProvider = ({ children, floorLevels }: Props) => {
  return (
    <FloorLevelsContext.Provider value={floorLevels}>
      {children}
    </FloorLevelsContext.Provider>
  );
};

export default FloorLevelsProvider;
