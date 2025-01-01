import React, { Dispatch, SetStateAction, createContext } from "react";

export interface DisplaySettingsData {
  showRoomSpecific: boolean;
  setShowRoomSpecific: Dispatch<SetStateAction<boolean>>;

  editPolygon: boolean;
  setEditPolygon: Dispatch<SetStateAction<boolean>>;

  editRoomLabel: boolean;
  setEditRoomLabel: Dispatch<SetStateAction<boolean>>;
}

export const DisplaySettingsContext = createContext<DisplaySettingsData>({
  showRoomSpecific: false,
  setShowRoomSpecific: () => {},
  editPolygon: false,
  setEditPolygon: () => {},
  editRoomLabel: false,
  setEditRoomLabel: () => {},
});

interface Props {
  children: React.ReactNode;
  displaySettingsData: DisplaySettingsData;
}

export const DisplaySettingsProvider = ({
  children,
  displaySettingsData,
}: Props) => {
  return (
    <DisplaySettingsContext.Provider value={displaySettingsData}>
      {children}
    </DisplaySettingsContext.Provider>
  );
};

export default DisplaySettingsProvider;
