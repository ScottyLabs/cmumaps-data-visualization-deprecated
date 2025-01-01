import { Polygon } from "geojson";
import React, { Dispatch, SetStateAction, createContext } from "react";

export interface PolygonData {
  history: Polygon[];
  setHistory: Dispatch<SetStateAction<Polygon[]>>;
  historyIndex: number;
  setHistoryIndex: Dispatch<SetStateAction<number>>;
  coordsIndex: number;
  setCoordsIndex: Dispatch<SetStateAction<number>>;
}

export const PolygonContext = createContext<PolygonData>({
  history: [],
  setHistory: () => {},
  historyIndex: -1,
  setHistoryIndex: () => {},
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
