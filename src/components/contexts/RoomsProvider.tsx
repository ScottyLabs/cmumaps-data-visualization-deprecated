import React, { Dispatch, SetStateAction, createContext } from "react";
import { ID, RoomInfo } from "../shared/types";

export interface RoomsData {
  rooms: Record<ID, RoomInfo>;
  setRooms: Dispatch<SetStateAction<Record<ID, RoomInfo>>>;
}

export const RoomsContext = createContext<RoomsData>({
  rooms: {},
  setRooms: () => {},
});

interface Props {
  children: React.ReactNode;
  roomsData: RoomsData;
}

export const RoomsProvider = ({ children, roomsData: roomsData }: Props) => {
  return (
    <RoomsContext.Provider value={roomsData}>{children}</RoomsContext.Provider>
  );
};

export default RoomsProvider;
