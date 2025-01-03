import React from "react";
import { Line } from "react-konva";

import { getNodeIdSelected } from "../../lib/features/mouseEventSlice";
import { useAppSelector } from "../../lib/hooks";
import { ID } from "../shared/types";
import { getRoomId } from "../utils/utils";

interface Props {
  nodeIdOnDrag;
}

const EdgesDisplay = ({ nodeIdOnDrag }: Props) => {
  const nodeSize = useAppSelector((state) => state.ui.nodeSize);
  const mst = useAppSelector((state) => state.data.mst);
  const showRoomSpecific = useAppSelector((state) => state.ui.showRoomSpecific);
  const nodeIdSelected = useAppSelector((state) =>
    getNodeIdSelected(state.mouseEvent)
  );

  const nodes = useAppSelector((state) => state.data.nodes);
  const roomIdSelected = getRoomId(nodes, nodeIdSelected);

  const includedNodes = new Set();
  const edges: [number[], string][] = [];

  if (!nodes) {
    return;
  }

  const shouldRender = (curId: ID, neighborId: ID) => {
    // don't display an edge twice
    if (includedNodes.has(neighborId)) {
      return false;
    }

    // don't display edge of a node on drag
    if (nodeIdOnDrag === curId || nodeIdOnDrag === neighborId) {
      return false;
    }

    // don't display edge that connect to a different floor
    if (!nodes[neighborId]) {
      return false;
    }

    // logic for displaying room specific edges
    if (showRoomSpecific && nodes[curId].roomId !== roomIdSelected) {
      return false;
    }

    return true;
  };

  const getStrokeColor = (curId: ID, neighborId: ID) => {
    // orange if selected
    if (curId == nodeIdSelected || neighborId == nodeIdSelected) {
      return "orange";
    }

    // blue if in the mst
    if (mst) {
      if (
        (mst && mst[curId] && mst[curId][neighborId]) ||
        (mst[neighborId] && mst[neighborId][curId])
      ) {
        return "blue";
      }
    }

    // default is green
    return "green";
  };

  for (const curId in nodes) {
    for (const neighborId in nodes[curId].neighbors) {
      if (shouldRender(curId, neighborId)) {
        const line = [
          nodes[curId].pos.x,
          nodes[curId].pos.y,
          nodes[neighborId].pos.x,
          nodes[neighborId].pos.y,
        ];
        edges.push([line, getStrokeColor(curId, neighborId)]);
      }
    }
    includedNodes.add(curId);
  }

  return edges.map(([points, color], index: number) => {
    return (
      <Line
        key={index}
        points={points}
        stroke={color}
        strokeWidth={nodeSize / 2}
      />
    );
  });
};

export default EdgesDisplay;
