import React, { Dispatch, SetStateAction, createContext } from "react";

export interface NodeSizeData {
  nodeSize: number;
  setNodeSize: Dispatch<SetStateAction<number>>;
}

export const NodeSizeContext = createContext<NodeSizeData>({
  nodeSize: 0,
  setNodeSize: () => {},
});

interface Props {
  children: React.ReactNode;
  nodeSizeData: NodeSizeData;
}

export const NodeSizeProvider = ({
  children,
  nodeSizeData: NodeSizeData,
}: Props) => {
  return (
    <NodeSizeContext.Provider value={NodeSizeData}>
      {children}
    </NodeSizeContext.Provider>
  );
};

export default NodeSizeProvider;
