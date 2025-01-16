import React, { useMemo } from "react";

import { useGetNodesQuery } from "../../../lib/features/apiSlice";
import { getNodeIdSelected } from "../../../lib/features/mouseEventSlice";
import { useAppSelector } from "../../../lib/hooks";
import AddEdgeAcrossFloorsSection from "./AddEdgeAcrossFloorsSection";
import DifferentFloorNeighborTable from "./DifferentFloorNeighborTable";
import GraphInfoButtons from "./GraphInfoButtons";
import SameFloorNeighborTable from "./SameFloorNeighborTable";

interface Props {
  floorCode: string;
}

const GraphInfoDisplay = ({ floorCode }: Props) => {
  const { data: nodes } = useGetNodesQuery(floorCode);
  const nodeId = useAppSelector((state) => getNodeIdSelected(state.mouseEvent));
  const neighbors = nodes ? nodes[nodeId].neighbors : null;

  const { sameFloorNeighbors, differentFloorNeighbors } = useMemo(() => {
    const sameFloorNeighbors = {};
    const differentFloorNeighbors = {};

    for (const neighborId in neighbors) {
      if (neighbors[neighborId].toFloorInfo) {
        differentFloorNeighbors[neighborId] = neighbors[neighborId];
      } else {
        sameFloorNeighbors[neighborId] = neighbors[neighborId];
      }
    }

    return { sameFloorNeighbors, differentFloorNeighbors };
  }, [neighbors]);

  if (!neighbors || !nodes) {
    return;
  }

  return (
    <>
      <div className="mb-1 space-y-4">
        <GraphInfoButtons floorCode={floorCode} />
        <SameFloorNeighborTable
          floorCode={floorCode}
          sameFloorNeighbors={sameFloorNeighbors}
        />
        <DifferentFloorNeighborTable
          floorCode={floorCode}
          neighbors={neighbors}
          differentFloorNeighbors={differentFloorNeighbors}
        />
        {!floorCode.includes("outside") && (
          <AddEdgeAcrossFloorsSection floorCode={floorCode} nodes={nodes} />
        )}
      </div>
    </>
  );
};

export default GraphInfoDisplay;
