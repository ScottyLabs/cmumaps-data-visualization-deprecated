import { useSession, useUser } from "@clerk/nextjs";
import { Polygon } from "geojson";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import React, {
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Stage, Layer } from "react-konva";
import { toast } from "react-toastify";

import {
  ADD_DOOR_NODE,
  ADD_EDGE,
  ADD_NODE,
  DELETE_EDGE,
  GRAPH_SELECT,
  POLYGON_ADD_VERTEX,
  POLYGON_SELECT,
  setMode,
} from "../../lib/features/modeSlice";
import { getNodeIdSelected } from "../../lib/features/mouseEventSlice";
import {
  setEditRoomLabel,
  setShowRoomSpecific,
} from "../../lib/features/uiSlice";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import { useMyPresence } from "../../liveblocks.config";
import { LIVEBLOCKS_ENABLED, WEBSOCKET_DEV_ENABLED } from "../../settings";
import { GraphContext } from "../contexts/GraphProvider";
import { PolygonContext } from "../contexts/PolygonProvider";
import { RoomsContext } from "../contexts/RoomsProvider";
import { SaveStatusContext } from "../contexts/SaveStatusProvider";
import { VisibilitySettingsContext } from "../contexts/VisibilitySettingsProvider";
import { ID, Node } from "../shared/types";
import { addDoorNodeErrToast } from "../utils/graphUtils";
import { saveToPolygonHistory, saveToRooms } from "../utils/polygonUtils";
import { findRoomId } from "../utils/roomUtils";
import { dist, distPointToLine, getRoomId, savingHelper } from "../utils/utils";
import LiveCursors from "../zoom-pan/LiveCursors";
import DoorsDisplay from "./DoorsDisplay";
import EdgesDisplay from "./EdgesDisplay";
import LabelsDisplay from "./LabelsDisplay";
import NodesDisplay from "./NodesDisplay";
import PolygonsDisplay from "./PolygonsDisplay";
import SelectedPolygonDisplay from "./SelectedPolygonDisplay";
import WallsDisplay from "./WallsDisplay";

interface Props {
  floorCode: string;
  setCanPan: (canPan: boolean) => void;
  handleWheel;
  handleDragMove;
  scale: number;
  offset;
  stageRef;
}

const adjustPosition = (pos, offset, scale) => {
  return {
    x: Number(((pos.x - offset.x) / scale).toFixed(2)),
    y: Number(((pos.y - offset.y) / scale).toFixed(2)),
  };
};

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
  const { user } = useUser();
  const { session } = useSession();
  const dispatch = useAppDispatch();

  const mode = useAppSelector((state) => state.mode.mode);
  const nodeIdSelected = useAppSelector((state) =>
    getNodeIdSelected(state.mouseEvent)
  );

  const { showOutline, showNodes, showEdges, showPolygons } = useContext(
    VisibilitySettingsContext
  );
  const { rooms, setRooms } = useContext(RoomsContext);
  const { nodes, setNodes } = useContext(GraphContext);
  const roomIdSelected = getRoomId(nodes, nodeIdSelected);

  const editPolygon = useAppSelector((state) => state.mode.editPolygon);
  const editRoomLabel = useAppSelector((state) => state.ui.editRoomLabel);

  const setSaveStatus = useContext(SaveStatusContext);
  const { history, setHistory, historyIndex, setHistoryIndex, coordsIndex } =
    useContext(PolygonContext);

  const [nodeIdOnDrag, setNodeIdOnDrag] = useState<ID>("");

  const [token, setToken] = useState<string | null | undefined>(null);

  // get token
  useEffect(() => {
    (async () => {
      const token = await session?.getToken();
      setToken(token);
    })();
    // No need to refresh the token when session changes since
    // only used to establish connection with the WebSocket
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // websocket
  useEffect(() => {
    if (!token) {
      return;
    }

    if (process.env.NODE_ENV === "development" && !WEBSOCKET_DEV_ENABLED) {
      return;
    }

    const socket = new WebSocket(
      `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}?userName=${user?.firstName || ""}&floorCode=${floorCode}&token=${token}`
    );

    // Set up event listeners for the WebSocket
    socket.onopen = () => {
      console.log("WebSocket connection established");
      socket.send(JSON.stringify({ action: "refreshUserCount", floorCode }));
    };

    socket.onmessage = (event) => {
      console.log("Received message:", event.data);
    };

    socket.onerror = (error) => {
      console.log("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    // Cleanup function to close the WebSocket
    return () => socket.close();
  }, [floorCode, token, user?.firstName]);

  const [_myPresence, updateMyPresence] = LIVEBLOCKS_ENABLED
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useMyPresence()
    : [null, null];

  // Wrapped to disable all updateMyPresence if Liveblocks not enabled
  // Delay is useful for local testing with two tabs
  const updateMyPresenceWrapper = useCallback(
    (data) => {
      if (updateMyPresence) {
        // setTimeout(() => {
        updateMyPresence(data);
        // }, 5000);
      }
    },
    [updateMyPresence]
  );

  useEffect(() => {
    updateMyPresenceWrapper({ name: user?.firstName });
  }, [updateMyPresenceWrapper, user?.firstName]);

  function handleMouseMove(e) {
    const cursor = adjustPosition(
      e.currentTarget.getPointerPosition(),
      offset,
      scale
    );
    updateMyPresenceWrapper({ cursor });
  }

  const addNewNode = (newNode: Node) => {
    const newNodes = { ...nodes };

    const newNodeId = uuidv4();
    newNodes[newNodeId] = newNode;

    // create an edge between the selected node and the new node
    if (nodeIdSelected) {
      const newDist = dist(
        newNodes[newNodeId].pos,
        newNodes[nodeIdSelected].pos
      );
      newNodes[newNodeId].neighbors[nodeIdSelected] = { dist: newDist };
      newNodes[nodeIdSelected].neighbors[newNodeId] = { dist: newDist };
    }

    router.push(`${floorCode}?nodeId=${newNodeId}`);

    setNodes(newNodes);

    savingHelper(
      "/api/updateGraph",
      JSON.stringify({
        floorCode: floorCode,
        newGraph: JSON.stringify(newNodes),
      }),
      setSaveStatus
    );
  };

  const handleStageClick = (e) => {
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
      const pos = adjustPosition(e.target.getPointerPosition(), offset, scale);
      const newNode: Node = {
        pos: pos,
        neighbors: {},
        roomId: findRoomId(rooms, pos),
      };
      addNewNode(newNode);
      dispatch(setMode(GRAPH_SELECT));
    } else if (mode == POLYGON_ADD_VERTEX) {
      const pos = adjustPosition(e.target.getPointerPosition(), offset, scale);
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
      saveToRooms(
        floorCode,
        roomIdSelected,
        rooms,
        setRooms,
        newPolygon,
        setSaveStatus
      );

      dispatch(setMode(POLYGON_SELECT));
    }
    // click to unselect a room or exit polygon editing or room label editing
    else if (e.target === e.target.getStage()) {
      router.push(floorCode);
      dispatch(setShowRoomSpecific(false));
      dispatch(setEditRoomLabel(false));
      dispatch(setMode(GRAPH_SELECT));
    }
  };

  const handleOnMouseDown = (e) => {
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

  return (
    <>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => updateMyPresenceWrapper({ active: true })}
        onMouseLeave={() => updateMyPresenceWrapper({ active: false })}
        onMouseDown={handleOnMouseDown}
        onMouseUp={() => setCanPan(true)}
        onClick={(e) => handleStageClick(e)}
        draggable
        onWheel={handleWheel}
        onDragMove={handleDragMove}
        scaleX={scale}
        scaleY={scale}
        x={offset.x}
        y={offset.y}
        ref={stageRef}
      >
        <Layer>
          {showOutline && <WallsDisplay />}
          {showOutline && <DoorsDisplay floorCode={floorCode} />}

          {showPolygons && <PolygonsDisplay floorCode={floorCode} />}

          {showEdges && !editPolygon && !editRoomLabel && (
            <EdgesDisplay nodeIdOnDrag={nodeIdOnDrag} />
          )}
          {showNodes && !editPolygon && !editRoomLabel && (
            <NodesDisplay
              floorCode={floorCode}
              updateMyPresenceWrapper={updateMyPresenceWrapper}
              setNodeIdOnDrag={setNodeIdOnDrag}
            />
          )}

          {roomIdSelected && (
            <SelectedPolygonDisplay
              floorCode={floorCode}
              roomIdSelected={roomIdSelected}
              polygon={rooms[roomIdSelected].polygon}
            />
          )}

          {<LabelsDisplay floorCode={floorCode} addNewNode={addNewNode} />}

          <Suspense fallback={<></>}>
            {LIVEBLOCKS_ENABLED && <LiveCursors scale={scale} />}
          </Suspense>
        </Layer>
      </Stage>
    </>
  );
};

export default FloorDisplay;
