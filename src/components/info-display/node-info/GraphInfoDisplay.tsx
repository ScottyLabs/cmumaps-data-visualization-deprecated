import React, { useContext, useMemo } from "react";

import { useAppSelector } from "../../../lib/hooks";
import { GraphContext } from "../../contexts/GraphProvider";
import { getNodeIdSelected } from "../../utils/utils";
import AddEdgeAcrossFloorsSection from "./AddEdgeAcrossFloorsSection";
import DifferentFloorNeighborTable from "./DifferentFloorNeighborTable";
import GraphInfoButtons from "./GraphInfoButtons";
import SameFloorNeighborTable from "./SameFloorNeighborTable";

interface Props {
  floorCode: string;
}

const GraphInfoDisplay = ({ floorCode }: Props) => {
  const { nodes } = useContext(GraphContext);

  const idSelected = useAppSelector((state) => state.mouseEvent.idSelected);
  const nodeId = getNodeIdSelected(idSelected);
  const neighbors = nodes[nodeId].neighbors;

  const { sameFloorNeighbors, differentFloorNeighbors } = useMemo(() => {
    const sameFloor = {};
    const differentFloor = {};

    for (const neighborId in neighbors) {
      if (neighbors[neighborId].toFloorInfo) {
        differentFloor[neighborId] = neighbors[neighborId];
      } else {
        sameFloor[neighborId] = neighbors[neighborId];
      }
    }

    return {
      sameFloorNeighbors: sameFloor,
      differentFloorNeighbors: differentFloor,
    };
  }, [neighbors]);

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
          <AddEdgeAcrossFloorsSection floorCode={floorCode} />
        )}
      </div>
    </>
  );
};

export default GraphInfoDisplay;
