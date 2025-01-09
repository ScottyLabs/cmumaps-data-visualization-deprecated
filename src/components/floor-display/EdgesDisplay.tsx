import React, { MutableRefObject } from "react";
import { Line } from "react-konva";

import { getNodeIdSelected } from "../../lib/features/mouseEventSlice";
import { CursorInfo } from "../../lib/features/usersSlice";
import { useAppSelector } from "../../lib/hooks";
import { Nodes, ID } from "../shared/types";
import { getRoomId } from "../utils/utils";

interface Props {
  nodes: Nodes;
  cursorInfoListRef: MutableRefObject<CursorInfo[]>;
}

const EdgesDisplay = ({ nodes, cursorInfoListRef }: Props) => {
  const nodeSize = useAppSelector((state) => state.ui.nodeSize);
  const mst = useAppSelector((state) => state.data.mst);
  const showRoomSpecific = useAppSelector((state) => state.ui.showRoomSpecific);
  const nodeIdSelected = useAppSelector((state) =>
    getNodeIdSelected(state.mouseEvent)
  );
  const nodeIdOnDrag = useAppSelector((state) => state.mouseEvent.nodeIdOnDrag);

  const roomIdSelected = getRoomId(nodes, nodeIdSelected);

  const includedNodes = new Set();
  const edges: [number[], string][] = [];

  const shouldRender = (curId: ID, neighborId: ID) => {
    // don't display an edge twice
    if (includedNodes.has(neighborId)) {
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

        // update with dragging information if needed
        if (curId === nodeIdOnDrag) {
          const cursorPos =
            cursorInfoListRef.current[cursorInfoListRef.current.length - 1];
          if (cursorPos) {
            line[0] = cursorPos.cursorPos.x;
            line[1] = cursorPos.cursorPos.y;
          }
        }
        if (neighborId === nodeIdOnDrag) {
          const cursorPos =
            cursorInfoListRef.current[cursorInfoListRef.current.length - 1];
          if (cursorPos) {
            line[2] = cursorPos.cursorPos.x;
            line[3] = cursorPos.cursorPos.y;
          }
        }

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
