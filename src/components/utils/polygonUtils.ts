import { Polygon } from "geojson";

import { ID } from "../shared/types";
import { savingHelper } from "./utils";

export const saveToPolygonHistory = (
  history,
  setHistory,
  historyIndex,
  setHistoryIndex,
  newPolygon: Polygon
) => {
  const nextHistory = [...history.slice(0, historyIndex + 1), newPolygon];
  setHistory(nextHistory);
  setHistoryIndex(nextHistory.length - 1);
};

export const saveToRooms = (
  floorCode,
  roomId: ID,
  rooms,
  setRooms,
  newPolygon: Polygon,
  setSaveStatus
) => {
  const newRooms = { ...rooms };

  newRooms[roomId].polygon = newPolygon;

  setRooms(newRooms);

  savingHelper(
    "/api/updateRoomInfo",
    JSON.stringify({
      floorCode: floorCode,
      roomId: roomId,
      newRoomInfo: newRooms[roomId],
    }),
    setSaveStatus
  );
};
