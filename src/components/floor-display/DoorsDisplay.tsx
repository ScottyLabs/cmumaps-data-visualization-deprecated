import { useRouter } from "next/navigation";

import React from "react";
import { Line } from "react-konva";

import { AS_NODE } from "../../app/api/addDoorToGraph/addDoorToGraphTypes";
import {
  ADD_DOOR_NODE,
  GRAPH_SELECT,
  selectEditPolygon,
  setMode,
} from "../../lib/features/modeSlice";
import { DOOR, NODE } from "../../lib/features/mouseEventSlice";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import { DoorInfo, Graph, ID } from "../shared/types";
import { setCursor } from "../utils/canvasUtils";
import { addDoorsToGraph } from "../utils/utils";

interface Props {
  floorCode: string;
  nodes: Graph;
}

const DoorsDisplay = ({ floorCode, nodes }: Props) => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const mode = useAppSelector((state) => state.mode.mode);
  const idSelected = useAppSelector((state) => state.mouseEvent.idSelected);
  const editPolygon = useAppSelector(selectEditPolygon);

  const doors = useAppSelector((state) => state.outline.doors);
  const roomlessDoors = useAppSelector((state) => state.outline.roomlessDoors);

  if (!doors || !roomlessDoors) {
    return;
  }

  const drawDoors = () => {
    const handleDoorClick = (doorId) => {
      if (!editPolygon) {
        if (mode == ADD_DOOR_NODE) {
          addDoorsToGraph(floorCode, [doors[doorId]], AS_NODE, dispatch);
          dispatch(setMode(GRAPH_SELECT));
        } else {
          router.push(`?doorId=${doorId}`);
        }
      }
    };

    const getStrokeColor = (doorId: ID) => {
      if (
        (idSelected.type == DOOR && doorId == idSelected.id) ||
        (idSelected.type == NODE &&
          doors[doorId].roomIds.includes(nodes[idSelected.id].roomId))
      ) {
        return "silver";
      }

      if (doors[doorId].roomIds.length != 2) {
        return "red";
      }

      return "purple";
    };

    return Object.entries(doors).map(([doorId, doorInfo]: [ID, DoorInfo]) =>
      doorInfo.lineList.map((points, index: number) => (
        // identify bezier curve by number of points
        <Line
          key={doorId + " " + index}
          points={points}
          stroke={getStrokeColor(doorId)}
          strokeWidth={1}
          bezier={points.length == 8}
          onMouseEnter={(e) => setCursor(e, "pointer")}
          onMouseLeave={(e) => setCursor(e, "default")}
          onClick={() => {
            handleDoorClick(doorId);
          }}
        />
      ))
    );
  };

  const drawRoomlessDoors = () => {
    return roomlessDoors.map((points, index) => (
      <Line
        key={index}
        points={points}
        stroke={"black"}
        strokeWidth={1}
        bezier={points.length == 8}
      />
    ));
  };

  return (
    <>
      {drawDoors()}
      {drawRoomlessDoors()}
    </>
  );
};

export default DoorsDisplay;
