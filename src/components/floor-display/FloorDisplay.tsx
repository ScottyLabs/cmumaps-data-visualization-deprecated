import { Polygon } from "geojson";
import Konva from "konva";
import { throttle } from "lodash";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import React, { useContext, useEffect, useRef } from "react";
import { Stage, Layer } from "react-konva";
import { toast } from "react-toastify";

import useWebSocket from "../../hooks/useWebSocket";
import { savingHelper } from "../../lib/apiRoutes";
import { useGetGraphQuery } from "../../lib/features/apiSlice";
import { setNodes } from "../../lib/features/dataSlice";
import {
  ADD_DOOR_NODE,
  ADD_EDGE,
  ADD_NODE,
  DELETE_EDGE,
  GRAPH_SELECT,
  POLYGON_ADD_VERTEX,
  POLYGON_SELECT,
  selectEditPolygon,
  setMode,
} from "../../lib/features/modeSlice";
import { getNodeIdSelected } from "../../lib/features/mouseEventSlice";
import {
  setEditRoomLabel,
  setShowRoomSpecific,
} from "../../lib/features/uiSlice";
import { CursorInfo } from "../../lib/features/usersSlice";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import { CURSOR, WEBSOCKET_MESSAGE } from "../../lib/webSocketMiddleware";
import { LIVE_CURSORS_ENABLED } from "../../settings";
import { PolygonContext } from "../contexts/PolygonProvider";
import { RoomsContext } from "../contexts/RoomsProvider";
import { Node, PDFCoordinate } from "../shared/types";
import { getCursorPos } from "../utils/canvasUtils";
import { addDoorNodeErrToast } from "../utils/graphUtils";
import { saveToPolygonHistory, saveToRooms } from "../utils/polygonUtils";
import { findRoomId } from "../utils/roomUtils";
import { distPointToLine, getRoomId } from "../utils/utils";
import DoorsDisplay from "./DoorsDisplay";
import EdgesDisplay from "./EdgesDisplay";
import LabelsDisplay from "./LabelsDisplay";
import LiveCursors, { CURSOR_INTERVAL } from "./LiveCursors";
import NodesDisplay from "./NodesDisplay";
import PolygonsDisplay from "./PolygonsDisplay";
import SelectedPolygonDisplay from "./SelectedPolygonDisplay";
import WallsDisplay from "./WallsDisplay";

interface Props {
  floorCode: string;
  setCanPan: (canPan: boolean) => void;
  handleWheel: (evt: Konva.KonvaEventObject<WheelEvent>) => void;
  handleDragMove: (evt: Konva.KonvaEventObject<DragEvent>) => void;
  scale: number;
  offset: PDFCoordinate;
  stageRef: React.RefObject<Konva.Stage>;
}

const FloorDisplay = ({
  floorCode,
  setCanPan,
  handleWheel,
  handleDragMove,
  scale,
  offset,
  stageRef,
}: Props) => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { data: nodes } = useGetGraphQuery(floorCode);

  const mode = useAppSelector((state) => state.mode.mode);
  const nodeIdSelected = useAppSelector((state) =>
    getNodeIdSelected(state.mouseEvent)
  );

  const showOutline = useAppSelector((state) => state.visibility.showOutline);
  const showNodes = useAppSelector((state) => state.visibility.showNodes);
  const showEdges = useAppSelector((state) => state.visibility.showEdges);
  const showPolygons = useAppSelector((state) => state.visibility.showPolygons);

  const { rooms, setRooms } = useContext(RoomsContext);
  const roomIdSelected = getRoomId(nodes, nodeIdSelected);

  const editPolygon = useAppSelector(selectEditPolygon);
  const editRoomLabel = useAppSelector((state) => state.ui.editRoomLabel);

  const { history, setHistory, historyIndex, setHistoryIndex, coordsIndex } =
    useContext(PolygonContext);

  // join WebSocket
  useWebSocket(floorCode);

  // store mouse positions
  const handleMouseMove = throttle((e) => {
    const cursorPos = getCursorPos(e, offset, scale);
    cursorInfoListRef.current.push({ cursorPos });
  }, CURSOR_INTERVAL);

  // sync cursor position
  const cursorInfoListRef = useRef<CursorInfo[]>([]);
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (cursorInfoListRef.current.length > 0) {
        dispatch({
          type: WEBSOCKET_MESSAGE,
          payload: { type: CURSOR, cursorInfoList: cursorInfoListRef.current },
        });
        cursorInfoListRef.current = [];
      }
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [dispatch]);

  const addNewNode = (newNode: Node) => {
    const newNodes = { ...nodes };

    const newNodeId = uuidv4();
    newNodes[newNodeId] = newNode;

    // create an edge between the selected node and the new node
    if (nodeIdSelected) {
      newNodes[newNodeId].neighbors[nodeIdSelected] = {};
      newNodes[nodeIdSelected].neighbors[newNodeId] = {};
    }

    router.push(`?nodeId=${newNodeId}`);

    dispatch(setNodes(newNodes));

    savingHelper(
      "/api/updateGraph",
      JSON.stringify({
        floorCode: floorCode,
        newGraph: JSON.stringify(newNodes),
      })
    );
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnStage = e.target == e.target.getStage();

    // errors for each mode relative to stage clicking
    if (mode == ADD_NODE || mode == POLYGON_ADD_VERTEX) {
      if (!clickedOnStage) {
        toast.error("Click on empty space!");
        return;
      }
    } else if (mode == ADD_DOOR_NODE) {
      if (clickedOnStage) {
        addDoorNodeErrToast();
      }
    } else if (mode == ADD_EDGE || mode == DELETE_EDGE) {
      if (clickedOnStage) {
        toast.error("Click on another node!");
        return;
      }
    }

    if (mode == ADD_NODE) {
      const pos = getCursorPos(e, offset, scale);
      const newNode: Node = {
        pos: pos,
        neighbors: {},
        roomId: findRoomId(rooms, pos),
      };
      addNewNode(newNode);
      dispatch(setMode(GRAPH_SELECT));
    } else if (mode == POLYGON_ADD_VERTEX) {
      const pos = getCursorPos(e, offset, scale);
      const newVertex = [Number(pos.x.toFixed(2)), Number(pos.y.toFixed(2))];

      const polygon = rooms[roomIdSelected].polygon;

      const coords = polygon.coordinates[coordsIndex];

      const newPolygon: Polygon = JSON.parse(JSON.stringify(polygon));

      if (coords.length == 0) {
        // first and last coordinate need to be the same
        newPolygon.coordinates[coordsIndex].push(newVertex);
        newPolygon.coordinates[coordsIndex].push(newVertex);
      } else {
        let minDist = distPointToLine(newVertex, coords[0], coords[1]);
        let indexToInsert = 0;
        for (let i = 0; i < coords.length - 1; i++) {
          const curDist = distPointToLine(newVertex, coords[i], coords[i + 1]);
          if (curDist < minDist) {
            indexToInsert = i;
            minDist = curDist;
          }
        }

        newPolygon.coordinates[coordsIndex].splice(
          indexToInsert + 1,
          0,
          newVertex
        );
      }

      saveToPolygonHistory(
        history,
        setHistory,
        historyIndex,
        setHistoryIndex,
        newPolygon
      );
      saveToRooms(floorCode, roomIdSelected, rooms, setRooms, newPolygon);

      dispatch(setMode(POLYGON_SELECT));
    }
    // click to unselect a room or exit polygon editing or room label editing
    else if (e.target === e.target.getStage()) {
      router.push("?");
      dispatch(setShowRoomSpecific(false));
      dispatch(setEditRoomLabel(false));
      dispatch(setMode(GRAPH_SELECT));
    }
  };

  // Disable panning when dragging node, vertex, or label
  const handleOnMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    let newCanPan = true;

    // can't pan when dragging on node or vertex
    if (e.target.getClassName() === "Circle") {
      newCanPan = false;
    }

    // can't pan when dragging on label in label editing mode
    if (editRoomLabel && e.target.getClassName() === "Rect") {
      newCanPan = false;
    }

    setCanPan(newCanPan);
  };

  if (!nodes) {
    return;
  }

  return (
    <>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseMove={handleMouseMove}
        onMouseDown={handleOnMouseDown}
        onMouseUp={() => setCanPan(true)}
        onClick={handleStageClick}
        onWheel={handleWheel}
        onDragMove={handleDragMove}
        draggable
        scaleX={scale}
        scaleY={scale}
        x={offset.x}
        y={offset.y}
        ref={stageRef}
      >
        <Layer>
          {showOutline && <WallsDisplay />}
          {showOutline && <DoorsDisplay floorCode={floorCode} nodes={nodes} />}

          {showPolygons && <PolygonsDisplay />}

          {showEdges && !editPolygon && !editRoomLabel && (
            <EdgesDisplay nodes={nodes} />
          )}
          {showNodes && !editPolygon && !editRoomLabel && (
            <NodesDisplay
              floorCode={floorCode}
              nodes={nodes}
              cursorInfoListRef={cursorInfoListRef}
              offset={offset}
              scale={scale}
            />
          )}

          {roomIdSelected && (
            <SelectedPolygonDisplay
              floorCode={floorCode}
              roomIdSelected={roomIdSelected}
              polygon={rooms[roomIdSelected].polygon}
            />
          )}

          {
            <LabelsDisplay
              floorCode={floorCode}
              nodes={nodes}
              addNewNode={addNewNode}
            />
          }

          {LIVE_CURSORS_ENABLED && (
            <LiveCursors floorCode={floorCode} scale={scale} />
          )}
        </Layer>
      </Stage>
    </>
  );
};

export default FloorDisplay;
