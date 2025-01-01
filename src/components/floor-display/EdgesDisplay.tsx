import React, { useContext } from "react";
import { Line } from "react-konva";

import { useAppSelector } from "../../lib/hooks";
import { DisplaySettingsContext } from "../contexts/DisplaySettingsProvider";
import { GraphContext } from "../contexts/GraphProvider";
import { IdEventsContext } from "../contexts/IdEventsProvider";
import { ID } from "../shared/types";
import { getNodeIdSelected, getRoomId } from "../utils/utils";

interface Props {
  nodeIdOnDrag;
}

const EdgesDisplay = ({ nodeIdOnDrag }: Props) => {
  const nodeSize = useAppSelector((state) => state.nodeSize.nodeSize);

  const { nodes } = useContext(GraphContext);
  const { showRoomSpecific } = useContext(DisplaySettingsContext);
  const { idSelected } = useContext(IdEventsContext);
  const roomIdSelected = getRoomId(nodes, idSelected);

  const includedNodes = new Set();
  const edges: [number[], string][] = [];

  const getStrokeColor = (curID: ID, neighborID: ID) => {
    const nodeIdSelected = getNodeIdSelected(idSelected);
    if (curID == nodeIdSelected || neighborID == nodeIdSelected) {
      return "orange";
    }

    return "green";
  };

  for (const curID in nodes) {
    for (const neighborID in nodes[curID].neighbors) {
      // don't display an edge twice and don't display edge of a node on drag
      if (
        !includedNodes.has(neighborID) &&
        nodeIdOnDrag != curID &&
        nodeIdOnDrag != neighborID
      ) {
        // don't display edge that connect to a different floor
        if (nodes[neighborID]) {
          // logic for displaying room specific edges
          if (!showRoomSpecific || nodes[curID].roomId == roomIdSelected) {
            edges.push([
              [
                nodes[curID].pos.x,
                nodes[curID].pos.y,
                nodes[neighborID].pos.x,
                nodes[neighborID].pos.y,
              ],
              getStrokeColor(curID, neighborID),
            ]);
          }
        }
      }
    }
    includedNodes.add(curID);
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
