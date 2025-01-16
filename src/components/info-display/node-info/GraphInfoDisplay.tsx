import React, { useMemo } from "react";

import { getNodeIdSelected } from "../../../lib/features/mouseEventSlice";
import { useAppSelector } from "../../../lib/hooks";
import { Nodes, Rooms } from "../../shared/types";
import AddEdgeAcrossFloorsSection from "./AddEdgeAcrossFloorsSection";
import DifferentFloorNeighborTable from "./DifferentFloorNeighborTable";
import GraphInfoButtons from "./GraphInfoButtons";
import SameFloorNeighborTable from "./SameFloorNeighborTable";

interface Props {
  floorCode: string;
  rooms: Rooms;
  nodes: Nodes;
}

const GraphInfoDisplay = ({ floorCode, rooms, nodes }: Props) => {
  const nodeId = useAppSelector((state) => getNodeIdSelected(state.mouseEvent));

  // get neighbors of the node
  const neighbors = useMemo(() => {
    if (nodeId && nodes) {
      return nodes[nodeId]?.neighbors || {};
    }
    return {};
  }, [nodeId, nodes]);

  // calculate the same floor neighbors and different floor neighbors
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

  if (!nodes) {
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
          <AddEdgeAcrossFloorsSection
            floorCode={floorCode}
            rooms={rooms}
            nodes={nodes}
          />
        )}
      </div>
    </>
  );
};

export default GraphInfoDisplay;
