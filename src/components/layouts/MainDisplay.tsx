import { Polygon } from "geojson";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

import { DEFAULT_DENSITY } from "../../app/api/detectWalkway/detectWalkway";
import { savingHelper } from "../../lib/apiRoutes";
import { useGetGraphQuery } from "../../lib/features/apiSlice";
import { redo, setNodes, undo } from "../../lib/features/dataSlice";
import {
  ADD_DOOR_NODE,
  ADD_EDGE,
  ADD_NODE,
  DELETE_EDGE,
  GRAPH_SELECT,
  selectEditPolygon,
  setMode,
} from "../../lib/features/modeSlice";
import {
  deselect,
  getNodeIdSelected,
  selectDoor,
  selectNode,
} from "../../lib/features/mouseEventSlice";
import { setOutline } from "../../lib/features/outlineSlice";
import {
  failedLoading,
  finishLoading,
  LOADED,
  startLoading,
} from "../../lib/features/statusSlice";
import {
  toggleShowEdges,
  toggleShowFile,
  toggleShowLabels,
  toggleShowNodes,
  toggleShowOutline,
  toggleShowPolygons,
} from "../../lib/features/visibilitySlice";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import { TEST_WALKWAYS } from "../../settings";
import Loader from "../common/Loader";
import PolygonProvider from "../contexts/PolygonProvider";
import RoomsProvider from "../contexts/RoomsProvider";
import InfoDisplay from "../info-display/InfoDisplay";
import { deleteNode } from "../shared/keyboardShortcuts";
import { ID, RoomInfo, WalkwayTypeList } from "../shared/types";
import SidePanel from "../side-panel/SidePanel";
import { calcMst } from "../utils/graphUtils";
import { getNodeIdByRoomId, getRoomIdByRoomName } from "../utils/utils";
import ZoomPanWrapper from "../zoom-pan/ZoomPanWrapper";

interface Props {
  floorCode: string;
}

const MainDisplay = ({ floorCode }: Props) => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { data: nodes, isFetching } = useGetGraphQuery(floorCode);

  const idSelected = useAppSelector((state) => state.mouseEvent.idSelected);
  const nodeIdSelected = useAppSelector((state) =>
    getNodeIdSelected(state.mouseEvent)
  );
  const editPolygon = useAppSelector(selectEditPolygon);
  const loadingStatus = useAppSelector((state) => state.status.loadingStatus);
  const shortcutsDisabled = useAppSelector(
    (state) => state.status.shortcutsDisabled
  );

  const [rooms, setRooms] = useState<Record<ID, RoomInfo>>({});

  // polygon editing history
  const [history, setHistory] = useState<Polygon[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [coordsIndex, setCoordsIndex] = useState<number>(0);

  const polygonData = {
    history,
    setHistory,
    historyIndex,
    setHistoryIndex,
    coordsIndex,
    setCoordsIndex,
  };

  const parsePDF = useCallback(
    async (regenerate = false) => {
      dispatch(startLoading("Parsing PDF"));

      // parsing the file
      const parseResponse = await fetch("/api/parsePDF", {
        method: "POST",
        body: JSON.stringify({
          floorCode: floorCode,
          regenerate: regenerate,
        }),
      });

      const parsedBody = await parseResponse.json();

      // handle error
      if (!parseResponse.ok) {
        console.error(parsedBody.error);
        const errMessage =
          "Failed to parse the PDF! Check the Console for detailed error.";
        dispatch(failedLoading(errMessage));
        return;
      }

      const parsedRes = parsedBody.result;

      if (parsedRes["floorCodeDNE"]) {
        toast.warn(
          "Couldn't add type and alias because this floor code does not exist in Nicolas-export.json!",
          { autoClose: 5000 }
        );
      }

      dispatch(
        setOutline({
          walls: parsedRes["walls"],
          doors: parsedRes["doors"],
          roomlessDoors: parsedRes["roomlessDoors"],
        })
      );

      setRooms(parsedRes["rooms"]);

      dispatch(startLoading("Detecting Walkways"));

      if (!parsedRes["calculated"] || TEST_WALKWAYS) {
        const newRooms = parsedRes["rooms"];
        const walkways = Object.keys(newRooms).filter((roomId) =>
          WalkwayTypeList.includes(newRooms[roomId].type)
        );

        if (walkways.length > 0) {
          const walkwayResult = await fetch("/api/detectWalkways", {
            method: "POST",
            body: JSON.stringify({
              floorCode: floorCode,
              walkways: walkways,
              density: DEFAULT_DENSITY,
            }),
          });

          const walkwayBody = await walkwayResult.json();

          if (!walkwayResult.ok) {
            console.error(walkwayBody.error);
            return;
          }
        }
      }

      dispatch(finishLoading());
    },
    [dispatch, floorCode]
  );

  // fetch data
  useEffect(() => {
    parsePDF();
  }, [floorCode, parsePDF]);

  // keyboard shortcuts
  useEffect(() => {
    if (shortcutsDisabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const toastNodeNotSelectedErr = () => toast.error("Select a node first!");

      // visibility
      if (event.key === "f") {
        dispatch(toggleShowFile());
      } else if (event.key === "o") {
        dispatch(toggleShowOutline());
      } else if (event.key === "g") {
        dispatch(toggleShowNodes());
        dispatch(toggleShowEdges());
      } else if (event.key === "l") {
        dispatch(toggleShowLabels());
      } else if (event.key === "p") {
        dispatch(toggleShowPolygons());
      }

      // quit
      else if (event.key === "q") {
        dispatch(setMode(GRAPH_SELECT));
      }

      // disable graph shortcuts in edit polygon mode
      if (editPolygon) {
        return;
      }

      // graph
      else if (event.key === "n") {
        dispatch(setMode(ADD_NODE));
      } else if (event.key === "e") {
        if (nodeIdSelected) {
          dispatch(setMode(ADD_EDGE));
        } else {
          toastNodeNotSelectedErr();
        }
      } else if (event.key === "d") {
        if (nodeIdSelected) {
          dispatch(setMode(DELETE_EDGE));
        } else {
          toastNodeNotSelectedErr();
        }
      } else if (event.key === "m") {
        if (nodes) {
          calcMst(nodes, rooms, router, dispatch);
        }
      } else if (
        event.key === "Backspace" ||
        event.key === "Delete" ||
        event.key === "Escape"
      ) {
        if (nodeIdSelected && nodes) {
          deleteNode(nodes, nodeIdSelected, floorCode, router, dispatch);
        } else {
          toastNodeNotSelectedErr();
        }
      } else if (event.key === "w") {
        dispatch(setMode(ADD_DOOR_NODE));
      }

      // eidt history
      else if ((event.metaKey || event.ctrlKey) && event.key === "z") {
        if (event.shiftKey) {
          dispatch(redo());
        } else {
          dispatch(undo());
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    floorCode,
    idSelected,
    shortcutsDisabled,
    editPolygon,
    router,
    dispatch,
    nodeIdSelected,
    rooms,
    nodes,
  ]);

  // select node, door, or room based on searchParams
  const searchParams = useSearchParams();
  const [statesUpdated, setStateUpdated] = useState<boolean>(false);
  useEffect(() => {
    if (Object.keys(rooms).length == 0 || !nodes) {
      return;
    }

    let nodeId = searchParams.get("nodeId");
    let roomId = searchParams.get("roomId");
    const roomName = searchParams.get("roomName");

    // find room id from room name if there is no room id
    if (roomName && !roomId) {
      roomId = getRoomIdByRoomName(roomName, rooms);

      if (!roomId) {
        toast.error("Room doesn't exist!");
      }
    }

    // find node id from room id if there is no node id
    if (roomId && !nodeId) {
      nodeId = getNodeIdByRoomId(roomId, nodes);

      // create node if this room doesn't have a node
      if (!nodeId) {
        const newNodes = { ...nodes };

        nodeId = uuidv4();
        newNodes[nodeId] = {
          pos: rooms[roomId].labelPosition,
          neighbors: {},
          roomId: roomId,
        };

        dispatch(setNodes(newNodes));

        savingHelper(
          "/api/updateGraph",
          JSON.stringify({
            floorCode: floorCode,
            newGraph: JSON.stringify(newNodes),
          })
        );
      }
    }

    const doorId = searchParams.get("doorId");

    if (nodeId) {
      dispatch(selectNode(nodeId));
    } else if (doorId) {
      dispatch(selectDoor(doorId));
    } else {
      dispatch(deselect());
    }

    setStateUpdated(true);
  }, [dispatch, floorCode, nodes, rooms, searchParams]);

  if (!statesUpdated || loadingStatus !== LOADED) {
    return;
  }

  if (isFetching) {
    return <Loader loadingText="Fetching Graph" />;
  }

  return (
    <PolygonProvider polygonData={polygonData}>
      <RoomsProvider roomsData={{ rooms, setRooms }}>
        <div className="fixed top-1/2 z-50 -translate-y-1/2">
          <SidePanel floorCode={floorCode} parsePDF={parsePDF} />
        </div>
        <ZoomPanWrapper floorCode={floorCode} />
        {nodeIdSelected && (
          <div className="absolute right-4 top-28 z-50">
            <InfoDisplay floorCode={floorCode} />
          </div>
        )}
      </RoomsProvider>
    </PolygonProvider>
  );
};

export default MainDisplay;
