import React, { Dispatch, SetStateAction, createContext } from "react";
import { SaveStatus } from "./SaveStatusType";

export const SaveStatusContext = createContext<
  Dispatch<SetStateAction<SaveStatus>>
>(() => {});

interface Props {
  children: React.ReactNode;
  setSaveStatus: Dispatch<SetStateAction<SaveStatus>>;
}

export const SaveStatusProvider = ({ children, setSaveStatus }: Props) => {
  return (
    <SaveStatusContext.Provider value={setSaveStatus}>
      {children}
    </SaveStatusContext.Provider>
  );
};

export default SaveStatusProvider;
