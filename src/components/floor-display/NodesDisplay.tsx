import Konva from "konva";
import { throttle } from "lodash";
import { useRouter } from "next/navigation";

import React, { MutableRefObject, useState } from "react";
import { Circle } from "react-konva";
import { toast } from "react-toastify";

import { savingHelper } from "../../lib/apiRoutes";
import { setNodes } from "../../lib/features/dataSlice";
import {
  ADD_DOOR_NODE,
  ADD_EDGE,
  DELETE_EDGE,
  GRAPH_SELECT,
  setMode,
} from "../../lib/features/modeSlice";
import { getNodeIdSelected } from "../../lib/features/mouseEventSlice";
import { useUpdateNodeMutation } from "../../lib/features/nodeApiSlice";
import {
  CursorInfo,
  CursorInfoOnDragNode,
  moveNodeWithCursor,
} from "../../lib/features/usersSlice";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import {
  EdgeTypeList,
  NodeInfo,
  ID,
  Nodes,
  Rooms,
  PDFCoordinate,
} from "../shared/types";
import { getCursorPos, setCursor } from "../utils/canvasUtils";
import { addDoorNodeErrToast } from "../utils/graphUtils";
import { findRoomId } from "../utils/roomUtils";
import { dist, getRoomId } from "../utils/utils";
import { CURSOR_INTERVAL } from "./LiveCursors";

interface Props {
  floorCode: string;
  nodes: Nodes;
  rooms: Rooms;
  cursorInfoListRef: MutableRefObject<CursorInfo[]>;
  offset: PDFCoordinate;
  scale: number;
}

const NodesDisplay = ({
  floorCode,
  nodes,
  rooms,
  cursorInfoListRef,
  offset,
  scale,
}: Props) => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [oldNode, setOldNode] = useState<NodeInfo | null>(null);

  const [moveNode] = useUpdateNodeMutation();

  const mode = useAppSelector((state) => state.mode.mode);
  const nodeSize = useAppSelector((state) => state.ui.nodeSize);
  const showRoomSpecific = useAppSelector((state) => state.ui.showRoomSpecific);

  const nodeIdHovered = useAppSelector(
    (state) => state.mouseEvent.nodeIdOnHover
  );
  const nodeIdSelected = useAppSelector((state) =>
    getNodeIdSelected(state.mouseEvent)
  );
  const roomIdSelected = getRoomId(nodes, nodeIdSelected);

  if (!nodes) {
    return;
  }

  const getFillColor = (nodeId: ID) => {
    if (nodeId == nodeIdSelected) {
      return "yellow";
    }

    if (nodeId == nodeIdHovered) {
      return "cyan";
    }

    const hasAcrossFloorEdge =
      Object.values(nodes[nodeId].neighbors).filter(
        (neighbor) => neighbor.toFloorInfo
      ).length != 0;

    const isRoomAcrossFloorType =
      nodes[nodeId].roomId &&
      rooms[nodes[nodeId].roomId] &&
      EdgeTypeList.includes(rooms[nodes[nodeId].roomId].type);

    if (isRoomAcrossFloorType) {
      if (hasAcrossFloorEdge) {
        return "lime";
      } else {
        return "pink";
      }
    } else {
      if (hasAcrossFloorEdge) {
        return "pink";
      }
    }

    if (
      rooms[nodes[nodeId].roomId] &&
      rooms[nodes[nodeId].roomId].polygon.coordinates[0].length == 0
    ) {
      return "red";
    }

    if (
      rooms[nodes[nodeId].roomId] &&
      rooms[nodes[nodeId].roomId].type == "Inaccessible"
    ) {
      return "gray";
    }

    return "blue";
  };

  const getNodePos = (e: Konva.KonvaEventObject<DragEvent>) => {
    return {
      x: Number(e.target.x().toFixed(2)),
      y: Number(e.target.y().toFixed(2)),
    };
  };

  const handleNodeClick = (nodeId: ID) => {
    if (mode == GRAPH_SELECT) {
      router.push(`?nodeId=${nodeId}`);
    } else if (mode == ADD_EDGE) {
      if (!nodeIdSelected) {
        // this line should never run because we check that idSelected is
        // selected before setting mode to ADD_EDGE
        toast.error("Please select a node first!");
        return;
      }

      if (nodeIdSelected == nodeId) {
        toast.error("No self edge allowed!");
        return;
      }

      const addEdge = (nodeId, neighborID, newNodes) => {
        if (Object.keys(newNodes[nodeId].neighbors).includes(neighborID)) {
          toast.error("Edge already existed!");
          return false;
        }

        const newNode = JSON.parse(JSON.stringify(newNodes[nodeId]));

        newNode.neighbors[neighborID] = {
          dist: dist(newNodes[nodeId].pos, newNodes[neighborID].pos),
        };

        newNodes[nodeId] = newNode;

        return true;
      };

      const newNodes = { ...nodes };

      if (addEdge(nodeId, nodeIdSelected, newNodes)) {
        addEdge(nodeIdSelected, nodeId, newNodes);
      }

      dispatch(setNodes(newNodes));

      savingHelper(
        "/api/updateGraph",
        JSON.stringify({
          floorCode: floorCode,
          newGraph: JSON.stringify(newNodes),
        })
      );

      dispatch(setMode(GRAPH_SELECT));
    } else if (mode == DELETE_EDGE) {
      if (!nodeIdSelected) {
        // this line should never run because we check that idSelected is
        // selected before setting mode to ADD_EDGE
        toast.error("Please select a node first!");
        return;
      }

      if (!Object.keys(nodes[nodeId].neighbors).includes(nodeIdSelected)) {
        toast.error("No edge exist between these two nodes!");
        return;
      }

      const newNodes = { ...nodes };
      const newNode = JSON.parse(JSON.stringify(newNodes[nodeIdSelected]));

      delete newNodes[nodeId].neighbors[nodeIdSelected];

      delete newNode.neighbors[nodeId];
      newNodes[nodeIdSelected] = newNode;

      dispatch(setNodes(newNodes));

      savingHelper(
        "/api/updateGraph",
        JSON.stringify({
          floorCode: floorCode,
          newGraph: JSON.stringify(newNodes),
        })
      );

      dispatch(setMode(GRAPH_SELECT));
    } else if (mode == ADD_DOOR_NODE) {
      addDoorNodeErrToast();
    }
  };

  const handleOnDragEnd =
    (nodeId: ID) => (e: Konva.KonvaEventObject<DragEvent>) => {
      // create new node
      const newNode: NodeInfo = JSON.parse(JSON.stringify(nodes[nodeId]));
      newNode.pos = getNodePos(e);
      newNode.roomId = findRoomId(rooms, newNode.pos);

      if (oldNode) {
        moveNode({ floorCode, nodeId, oldNode, newNode });
      } else {
        // Probably never going to be toasted...
        toast.error("Drag on a node before releasing it!");
      }
    };

  const handleDragMove = (nodeId: string) =>
    throttle((e: Konva.KonvaEventObject<DragEvent>) => {
      getCursorPos(e, offset, scale, (cursorPos) => {
        const cursorInfo: CursorInfoOnDragNode = {
          nodeId: nodeId,
          cursorPos,
          nodePos: getNodePos(e),
        };

        cursorInfoListRef.current.push(cursorInfo);
        dispatch(moveNodeWithCursor({ floorCode, cursorInfo }));
      });
    }, CURSOR_INTERVAL);

  return Object.entries(nodes).map(
    ([nodeId, node]: [ID, NodeInfo], index: number) => {
      if (!(showRoomSpecific && node.roomId !== roomIdSelected)) {
        return (
          <Circle
            key={index}
            x={node.pos.x}
            y={node.pos.y}
            radius={nodeSize}
            fill={getFillColor(nodeId)}
            stroke="black"
            strokeWidth={nodeSize / 4}
            onMouseEnter={(e) => setCursor(e, "pointer")}
            onMouseLeave={(e) => setCursor(e, "default")}
            onClick={() => handleNodeClick(nodeId)}
            draggable
            onDragStart={() => setOldNode(nodes[nodeId])}
            onDragEnd={handleOnDragEnd(nodeId)}
            onDragMove={handleDragMove(nodeId)}
          />
        );
      }
    }
  );
};

export default NodesDisplay;
