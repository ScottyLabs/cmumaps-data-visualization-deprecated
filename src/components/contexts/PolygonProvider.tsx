import React, { Dispatch, SetStateAction, createContext } from "react";

export interface PolygonData {
  coordsIndex: number;
  setCoordsIndex: Dispatch<SetStateAction<number>>;
}

export const PolygonContext = createContext<PolygonData>({
  coordsIndex: 0,
  setCoordsIndex: () => {},
});

interface Props {
  children: React.ReactNode;
  polygonData: PolygonData;
}

export const PolygonProvider = ({
  children,
  polygonData: PolygonData,
}: Props) => {
  return (
    <PolygonContext.Provider value={PolygonData}>
      {children}
    </PolygonContext.Provider>
  );
};

export default PolygonProvider;
