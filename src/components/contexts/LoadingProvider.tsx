import React, { Dispatch, SetStateAction, createContext } from "react";

export interface LoadingData {
  loadingText: string;
  setLoadingText: Dispatch<SetStateAction<string>>;
  setLoadingFailed: Dispatch<SetStateAction<boolean>>;
}

export const LoadingContext = createContext<LoadingData>({
  loadingText: "",
  setLoadingText: () => {},
  setLoadingFailed: () => {},
});

interface Props {
  children: React.ReactNode;
  loadingData: LoadingData;
}

export const SettingsProvider = ({ children, loadingData }: Props) => {
  return (
    <LoadingContext.Provider value={loadingData}>
      {children}
    </LoadingContext.Provider>
  );
};

export default SettingsProvider;
