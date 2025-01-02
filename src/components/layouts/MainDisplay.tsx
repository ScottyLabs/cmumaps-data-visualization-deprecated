import { Polygon } from "geojson";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { useCallback, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

import { DEFAULT_DENSITY } from "../../app/api/detectWalkway/detectWalkway";
import {
  ADD_DOOR_NODE,
  ADD_EDGE,
  ADD_NODE,
  DELETE_EDGE,
  GRAPH_SELECT,
  setMode,
} from "../../lib/features/modeSlice";
import {
  deselect,
  getNodeIdSelected,
  selectDoor,
  selectNode,
} from "../../lib/features/mouseEventSlice";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import { TEST_WALKWAYS } from "../../settings";
import GraphProvider from "../contexts/GraphProvider";
// context providers
import { LoadingContext } from "../contexts/LoadingProvider";
import OutlineProvider from "../contexts/OutlineProvider";
import PolygonProvider from "../contexts/PolygonProvider";
import RoomsProvider from "../contexts/RoomsProvider";
import { SaveStatusContext } from "../contexts/SaveStatusProvider";
import { SaveStatus } from "../contexts/SaveStatusType";
import ShortcutsStatusProvider from "../contexts/ShortcutsStatusProvider";
import VisibilitySettingsProvider from "../contexts/VisibilitySettingsProvider";
import InfoDisplay from "../info-display/InfoDisplay";
import { deleteNode } from "../shared/keyboardShortcuts";
import { ID, Node, RoomInfo, DoorInfo, WalkwayTypeList } from "../shared/types";
// components
import SidePanel from "../side-panel/SidePanel";
import { calcMst } from "../utils/graphUtils";
import {
  getNodeIdByRoomId,
  getRoomIdByRoomName,
  savingHelper,
} from "../utils/utils";
import ZoomPanWrapper from "../zoom-pan/ZoomPanWrapper";

interface Props {
  floorCode: string;
  saveStatus: SaveStatus;
}

const MainDisplay = ({ floorCode }: Props) => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const idSelected = useAppSelector((state) => state.mouseEvent.idSelected);
  const nodeIdSelected = useAppSelector((state) =>
    getNodeIdSelected(state.mouseEvent)
  );
  const editPolygon = useAppSelector((state) => state.ui.editPolygon);

  const { loadingText, setLoadingText, setLoadingFailed } =
    useContext(LoadingContext);
  const setSaveStatus = useContext(SaveStatusContext);

  const [shortcutsDisabled, setShortcutsDisabled] = useState<boolean>(false);

  // visibility settings
  const [showFile, setShowFile] = useState(false);
  const [showOutline, setShowOutline] = useState(true);
  const [showNodes, setShowNodes] = useState(true);
  const [showEdges, setShowEdges] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [showPolygons, setShowPolygons] = useState(false);

  const visibilitySettings = {
    showFile,
    setShowFile,
    showOutline,
    setShowOutline,
    showNodes,
    setShowNodes,
    showEdges,
    setShowEdges,
    showLabels,
    setShowLabels,
    showPolygons,
    setShowPolygons,
  };

  // display data
  const [walls, setWalls] = useState<number[][]>([]);
  const [doors, setDoors] = useState<Record<ID, DoorInfo>>({});
  const [roomlessDoors, setRoomlessDoors] = useState<number[][]>([]);
  const [rooms, setRooms] = useState<Record<ID, RoomInfo>>({});
  const [nodes, setNodes] = useState<Record<ID, Node>>({});

  const outlineData = {
    walls,
    doors,
    setDoors,
    roomlessDoors,
    setRoomlessDoors,
  };

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
      setLoadingText("Parsing PDF");

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
        setLoadingFailed(true);
        setLoadingText(
          "Failed to parse the PDF! Check the Console for detailed error."
        );
        return;
      }

      const parsedRes = parsedBody.result;

      if (parsedRes["floorCodeDNE"]) {
        toast.warn(
          "Couldn't add type and alias because this floor code does not exist in Nicolas-export.json!",
          { autoClose: 5000 }
        );
      }

      setWalls(parsedRes["walls"]);
      setDoors(parsedRes["doors"]);
      setRoomlessDoors(parsedRes["roomlessDoors"]);
      setRooms(parsedRes["rooms"]);

      setLoadingText("Detecting Walkways");

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

      const graphResult = await fetch(`/api/getGraph?floorCode=${floorCode}`, {
        method: "GET",
      });

      const graphBody = await graphResult.json();

      if (!graphResult.ok) {
        console.error(graphBody.error);
        return;
      }

      setNodes(graphBody.result);

      setLoadingText("");
    },
    [floorCode, setLoadingFailed, setLoadingText]
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
        setShowFile(!showFile);
      } else if (event.key === "o") {
        setShowOutline(!showOutline);
      } else if (event.key === "g") {
        setShowNodes(!showNodes);
        setShowEdges(!showEdges);
      } else if (event.key === "l") {
        setShowLabels(!showLabels);
      } else if (event.key === "p") {
        setShowPolygons(!showPolygons);
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
        calcMst(nodes, dispatch);
      } else if (
        event.key === "Backspace" ||
        event.key === "Delete" ||
        event.key === "Escape"
      ) {
        if (nodeIdSelected) {
          deleteNode(
            nodes,
            nodeIdSelected,
            setNodes,
            floorCode,
            setSaveStatus,
            router,
            dispatch
          );
        } else {
          toastNodeNotSelectedErr();
        }
      } else if (event.key === "w") {
        dispatch(setMode(ADD_DOOR_NODE));
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    floorCode,
    idSelected,
    nodes,
    shortcutsDisabled,
    editPolygon,
    showFile,
    showOutline,
    showNodes,
    showEdges,
    showLabels,
    router,
    showPolygons,
    setSaveStatus,
    dispatch,
  ]);

  // select node, door, or room based on searchParams
  const searchParams = useSearchParams();
  useEffect(() => {
    if (Object.keys(rooms).length == 0 || Object.keys(nodes).length == 0) {
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

        setNodes(newNodes);

        savingHelper(
          "/api/updateGraph",
          JSON.stringify({
            floorCode: floorCode,
            newGraph: JSON.stringify(newNodes),
          }),
          setSaveStatus
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
  }, [floorCode, nodes, rooms, searchParams, setSaveStatus]);

  return (
    !loadingText && (
      <ShortcutsStatusProvider
        shortcutsStatusData={{ shortcutsDisabled, setShortcutsDisabled }}
      >
        <PolygonProvider polygonData={polygonData}>
          <RoomsProvider roomsData={{ rooms, setRooms }}>
            <OutlineProvider outlineData={outlineData}>
              <GraphProvider graphData={{ nodes, setNodes }}>
                <VisibilitySettingsProvider
                  visibilitySettingsData={visibilitySettings}
                >
                  <div className="fixed top-1/2 z-50 -translate-y-1/2">
                    <SidePanel floorCode={floorCode} parsePDF={parsePDF} />
                  </div>
                  <ZoomPanWrapper floorCode={floorCode} />
                  {nodeIdSelected && (
                    <div className="absolute right-4 top-28 z-50">
                      <InfoDisplay floorCode={floorCode} />
                    </div>
                  )}
                </VisibilitySettingsProvider>
              </GraphProvider>
            </OutlineProvider>
          </RoomsProvider>
        </PolygonProvider>
      </ShortcutsStatusProvider>
    )
  );
};

export default MainDisplay;
