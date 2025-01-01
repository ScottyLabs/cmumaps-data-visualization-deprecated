import React, { Dispatch, SetStateAction, createContext } from "react";

export interface VisibilitySettingsData {
  showFile: boolean;
  setShowFile: Dispatch<SetStateAction<boolean>>;
  showOutline: boolean;
  setShowOutline: Dispatch<SetStateAction<boolean>>;
  showNodes: boolean;
  setShowNodes: Dispatch<SetStateAction<boolean>>;
  showEdges: boolean;
  setShowEdges: Dispatch<SetStateAction<boolean>>;
  showLabels: boolean;
  setShowLabels: Dispatch<SetStateAction<boolean>>;
  showPolygons: boolean;
  setShowPolygons: Dispatch<SetStateAction<boolean>>;
}

export const VisibilitySettingsContext = createContext<VisibilitySettingsData>({
  showFile: false,
  setShowFile: () => {},
  showOutline: false,
  setShowOutline: () => {},
  showNodes: false,
  setShowNodes: () => {},
  showEdges: false,
  setShowEdges: () => {},
  showLabels: false,
  setShowLabels: () => {},
  showPolygons: false,
  setShowPolygons: () => {},
});

interface Props {
  children: React.ReactNode;
  visibilitySettingsData: VisibilitySettingsData;
}

export const VisibilitySettingsProvider = ({
  children,
  visibilitySettingsData,
}: Props) => {
  return (
    <VisibilitySettingsContext.Provider value={visibilitySettingsData}>
      {children}
    </VisibilitySettingsContext.Provider>
  );
};

export default VisibilitySettingsProvider;
