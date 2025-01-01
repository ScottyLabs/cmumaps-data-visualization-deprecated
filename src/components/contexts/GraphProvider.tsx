import React, { Dispatch, SetStateAction, createContext } from "react";
import { ID, Node } from "../shared/types";

export interface GraphData {
  nodes: Record<ID, Node>;
  setNodes: Dispatch<SetStateAction<Record<ID, Node>>>;
}

export const GraphContext = createContext<GraphData>({
  nodes: {},
  setNodes: () => {},
});

interface Props {
  children: React.ReactNode;
  graphData: GraphData;
}

export const GraphProvider = ({ children, graphData: graphData }: Props) => {
  return (
    <GraphContext.Provider value={graphData}>{children}</GraphContext.Provider>
  );
};

export default GraphProvider;
