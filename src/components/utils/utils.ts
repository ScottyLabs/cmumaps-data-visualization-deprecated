import { toast } from "react-toastify";

import { extractBuildingCode } from "../../app/api/apiUtils";
import { setNodes } from "../../lib/features/dataSlice";
import {
  Nodes,
  ID,
  PDFCoordinate,
  RoomInfo,
  Rooms,
  RoomInfoWithoutTimestamp,
} from "../shared/types";

/**
 * @param roomName
 * @param rooms
 * @returns the id of the room that has `roomName`, `null` if no such room exist
 */
export const getRoomIdByRoomName = (roomName: string, rooms: Rooms) => {
  for (const roomId of Object.keys(rooms)) {
    if (rooms[roomId].name == roomName) {
      return roomId;
    }
  }

  return null;
};

/**
 * @param roomId
 * @param graph
 * @returns the id of the first node in `graph` that belong to the room
 * identified by `roomId`, `null` if roomId is null or no such node exist
 */
export const getNodeIdByRoomId = (roomId: ID | null, graph: Nodes) => {
  if (roomId == null) {
    return null;
  }

  for (const nodeId of Object.keys(graph)) {
    if (graph[nodeId].roomId == roomId) {
      return nodeId;
    }
  }

  return null;
};

// geometry
export const distPointToLine = (p1, p2, p3) => {
  const x = p1[0];
  const y = p1[1];
  const x1 = p2[0];
  const y1 = p2[1];
  const x2 = p3[0];
  const y2 = p3[1];

  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;

  //in case of 0 length line
  if (len_sq != 0) {
    param = dot / len_sq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
};

export const dist = (p1: PDFCoordinate, p2: PDFCoordinate) => {
  return Number(Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2).toFixed(2));
};

// variable getters
export const getRoomId = (nodes, nodeId: ID) => {
  return nodeId ? nodes[nodeId]?.roomId : "";
};

export const getInfoFromRoomId = (roomId: ID) => {
  const list = roomId.split("-");
  return {
    buildingCode: list[0],
    roomName: list[1],
  };
};

export const getBuildingCodeFromRoomId = (roomId: ID) => {
  return roomId.split("-")[0];
};

export const getRoomNameFromRoomId = (roomId: ID) => {
  return roomId.split("-")[1];
};

export const extractFloorLevelFromRoomName = (roomName: string) => {
  const FLOOR_REGEX = /^[A-F0-9]|LL|M|EV|PH/; // matches A-F, 0-9, and LL at the start of a string
  return roomName.match(FLOOR_REGEX)?.[0] || "";
};

export const getRoomIdFromRoomInfo = (
  floorCode: string,
  roomInfo: RoomInfo | RoomInfoWithoutTimestamp
) => {
  const buildingCode = extractBuildingCode(floorCode);
  return `${buildingCode}-${roomInfo.name}`;
};

// others
export const addDoorsToGraph = async (floorCode, doorInfos, type, dispatch) => {
  const response = await fetch("/api/addDoorToGraph", {
    method: "POST",
    body: JSON.stringify({
      floorCode: floorCode,
      doorInfos: doorInfos,
      type: type,
    }),
  });
  const body = await response.json();

  // handle error
  if (!response.ok) {
    if (response.status == 500) {
      console.error(body.error);
      return;
    } else {
      toast.error(body.errorMessage);
      return;
    }
  }

  dispatch(setNodes(body.nodes));
};
