import { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

import { DEFAULT_DENSITY } from "../../app/api/detectWalkway/detectWalkway";
import { INVALID_NODE_ID } from "../../hooks/errorCodes";
import useKeyboardShortcuts from "../../hooks/useKeyboardShortcuts";
import { savingHelper } from "../../lib/apiRoutes";
import {
  useGetNodesQuery,
  useGetRoomsQuery,
  useInvalidateCacheMutation,
} from "../../lib/features/apiSlice";
import { setNodes } from "../../lib/features/dataSlice";
import { redo, undo } from "../../lib/features/historySlice";
import {
  ADD_DOOR_NODE,
  ADD_EDGE,
  ADD_NODE,
  DELETE_EDGE,
  GRAPH_SELECT,
  POLYGON_ADD_VERTEX,
  POLYGON_DELETE_VERTEX,
  setMode,
} from "../../lib/features/modeSlice";
import { selectEditPolygon } from "../../lib/features/modeSlice";
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
import InfoDisplay from "../info-display/InfoDisplay";
import { deleteNode } from "../shared/keyboardShortcuts";
import { WalkwayTypeList } from "../shared/types";
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

  const {
    data: nodes,
    isFetching: isFetchingNodes,
    isError: isErrorNodes,
    error: nodesError,
  } = useGetNodesQuery(floorCode);
  const {
    data: rooms,
    isFetching: isFetchingRooms,
    isError: isErrorRooms,
    error: roomsError,
  } = useGetRoomsQuery(floorCode);

  const [invalidateCache] = useInvalidateCacheMutation();

  const editPolygon = useAppSelector(selectEditPolygon);
  const nodeIdSelected = useAppSelector((state) =>
    getNodeIdSelected(state.mouseEvent)
  );
  const loadingStatus = useAppSelector((state) => state.status.loadingStatus);

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

  // handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const toastNodeNotSelectedErr = () => toast.error("Select a node first!");

      // general keyboard shortcuts
      switch (event.key) {
        // visibility
        case "f":
          dispatch(toggleShowFile());
          break;
        case "o":
          dispatch(toggleShowOutline());
          break;
        case "g":
          dispatch(toggleShowNodes());
          dispatch(toggleShowEdges());
          break;
        case "l":
          dispatch(toggleShowLabels());
          break;
        case "p":
          dispatch(toggleShowPolygons());
          break;

        // quit
        case "q":
          dispatch(setMode(GRAPH_SELECT));
          break;

        // refetch data
        case "r":
          invalidateCache();
          break;

        // edit history
        case "z":
          if (event.metaKey || event.ctrlKey) {
            if (event.shiftKey) {
              dispatch(redo());
            } else {
              dispatch(undo());
            }
          }
          break;
      }

      if (editPolygon) {
        // polygon keyboard shortcuts
        switch (event.key) {
          case "d":
            dispatch(setMode(POLYGON_DELETE_VERTEX));
            break;
          case "v":
            dispatch(setMode(POLYGON_ADD_VERTEX));
            break;
        }
      } else {
        // graph keyboard shortcuts
        switch (event.key) {
          // graph
          case "n":
            dispatch(setMode(ADD_NODE));
            break;
          case "e":
            if (nodeIdSelected) {
              dispatch(setMode(ADD_EDGE));
            } else {
              toastNodeNotSelectedErr();
            }
            break;
          case "d":
            if (nodeIdSelected) {
              dispatch(setMode(DELETE_EDGE));
            } else {
              toastNodeNotSelectedErr();
            }
            break;
          case "m":
            if (nodes && rooms) {
              calcMst(nodes, rooms, router, dispatch);
            }
            break;

          // delete or backspace to delete a node
          case "Backspace":
          case "Delete":
            if (nodeIdSelected && nodes) {
              deleteNode(nodes, nodeIdSelected, floorCode, router, dispatch);
            } else {
              toastNodeNotSelectedErr();
            }
            break;

          case "w":
            dispatch(setMode(ADD_DOOR_NODE));
            break;

          // enters polygon editing mode
          case "v":
            if (nodeIdSelected) {
              dispatch(setMode(POLYGON_ADD_VERTEX));
            }
            break;
        }
      }
    },
    [
      dispatch,
      editPolygon,
      floorCode,
      invalidateCache,
      nodeIdSelected,
      nodes,
      rooms,
      router,
    ]
  );
  useKeyboardShortcuts(handleKeyDown);

  // fetch data
  useEffect(() => {
    parsePDF();
  }, [floorCode, parsePDF]);

  // select node, door, or room based on searchParams
  const searchParams = useSearchParams();
  const [statesUpdated, setStateUpdated] = useState<boolean>(false);
  useEffect(() => {
    if (!rooms || !nodes) {
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
        // newNodes[nodeId] = {
        //   pos: rooms[roomId].labelPosition,
        //   neighbors: {},
        //   roomId: roomId,
        // };

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
      if (nodes[nodeId]) {
        dispatch(selectNode(nodeId));
      } else {
        router.push(`?error=${INVALID_NODE_ID}`);
      }
    } else if (doorId) {
      dispatch(selectDoor(doorId));
    } else {
      dispatch(deselect());
    }

    setStateUpdated(true);
    // putting nodes and rooms in the dependency array causes too many rerenders
    // when dragging. Having isFetching variables is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dispatch,
    floorCode,
    isFetchingNodes,
    isFetchingRooms,
    router,
    searchParams,
  ]);

  if (isErrorNodes || isErrorRooms) {
    if (isErrorNodes) {
      const error = nodesError as FetchBaseQueryError;
      console.error((error.data as { error: string }).error);
    }

    if (isErrorRooms) {
      const error = roomsError as FetchBaseQueryError;
      console.error((error.data as { error: string }).error);
    }

    return (
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2">
        <p className="text-nowrap text-3xl text-red-500">
          Failed to fetch data!
        </p>
      </div>
    );
  }

  if (!statesUpdated || loadingStatus !== LOADED) {
    return;
  }

  if (isFetchingNodes || isFetchingRooms) {
    return <Loader loadingText="Fetching Data" />;
  }

  return (
    <>
      <div className="fixed top-1/2 z-50 -translate-y-1/2">
        <SidePanel floorCode={floorCode} parsePDF={parsePDF} />
      </div>
      <ZoomPanWrapper floorCode={floorCode} />
      {nodeIdSelected && (
        <div className="absolute right-4 top-28 z-50">
          <InfoDisplay floorCode={floorCode} />
        </div>
      )}
    </>
  );
};

export default MainDisplay;
