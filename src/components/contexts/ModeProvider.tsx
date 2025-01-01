import React, { Dispatch, SetStateAction, createContext } from "react";

export type Mode =
  | "Graph Select"
  | "Graph Add Edge"
  | "Graph Delete Edge"
  | "Graph Add Node"
  | "Polygon Select"
  | "Polygon Add Vertex"
  | "Polygon Delete Vertex"
  | "Graph Add Door Node";
export const GRAPH_SELECT: Mode = "Graph Select";
export const ADD_EDGE: Mode = "Graph Add Edge";
export const DELETE_EDGE: Mode = "Graph Delete Edge";
export const ADD_NODE: Mode = "Graph Add Node";
export const ADD_DOOR_NODE: Mode = "Graph Add Door Node";

export const POLYGON_SELECT: Mode = "Polygon Select";
export const POLYGON_ADD_VERTEX: Mode = "Polygon Add Vertex";
export const POLYGON_DELETE_VERTEX: Mode = "Polygon Delete Vertex";

export interface ModeData {
  mode: Mode;
  setMode: Dispatch<SetStateAction<Mode>>;
}

export const ModeContext = createContext<ModeData>({
  mode: GRAPH_SELECT,
  setMode: () => {},
});

interface Props {
  children: React.ReactNode;
  modeData: ModeData;
}

export const ModeProvider = ({ children, modeData }: Props) => {
  return (
    <ModeContext.Provider value={modeData}>{children}</ModeContext.Provider>
  );
};

export default ModeProvider;
