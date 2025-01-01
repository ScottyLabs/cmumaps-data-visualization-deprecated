import React, { Dispatch, SetStateAction, createContext } from "react";

export interface ShortcutsStatusData {
  shortcutsDisabled: boolean;
  setShortcutsDisabled: Dispatch<SetStateAction<boolean>>;
}

export const ShortcutsStatusContext = createContext<ShortcutsStatusData>({
  shortcutsDisabled: false,
  setShortcutsDisabled: () => {},
});

interface Props {
  children: React.ReactNode;
  shortcutsStatusData: ShortcutsStatusData;
}

export const ShortcutsStatusProvider = ({
  children,
  shortcutsStatusData: ShortcutsData,
}: Props) => {
  return (
    <ShortcutsStatusContext.Provider value={ShortcutsData}>
      {children}
    </ShortcutsStatusContext.Provider>
  );
};

export default ShortcutsStatusProvider;
