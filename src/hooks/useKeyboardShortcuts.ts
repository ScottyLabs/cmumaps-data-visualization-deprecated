import { useRouter } from "next/navigation";

import { useEffect } from "react";
import { toast } from "react-toastify";

import { deleteNode } from "../components/shared/keyboardShortcuts";
import { Nodes, Rooms } from "../components/shared/types";
import { calcMst } from "../components/utils/graphUtils";
import { useInvalidateNodesCacheMutation } from "../lib/features/apiSlice";
import { redo, undo } from "../lib/features/historySlice";
import {
  ADD_DOOR_NODE,
  ADD_EDGE,
  ADD_NODE,
  DELETE_EDGE,
  GRAPH_SELECT,
  selectEditPolygon,
  setMode,
} from "../lib/features/modeSlice";
import { getNodeIdSelected } from "../lib/features/mouseEventSlice";
import {
  toggleShowEdges,
  toggleShowFile,
  toggleShowLabels,
  toggleShowNodes,
  toggleShowOutline,
  toggleShowPolygons,
} from "../lib/features/visibilitySlice";
import { useAppDispatch, useAppSelector } from "../lib/hooks";

const useKeyboardShortcuts = (
  floorCode: string,
  nodes: Nodes | undefined,
  rooms: Rooms
) => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [invalidateNodesCache] = useInvalidateNodesCacheMutation();

  const idSelected = useAppSelector((state) => state.mouseEvent.idSelected);
  const nodeIdSelected = useAppSelector((state) =>
    getNodeIdSelected(state.mouseEvent)
  );
  const editPolygon = useAppSelector(selectEditPolygon);
  const shortcutsDisabled = useAppSelector(
    (state) => state.status.shortcutsDisabled
  );

  useEffect(() => {
    if (shortcutsDisabled) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      const toastNodeNotSelectedErr = () => toast.error("Select a node first!");

      if (editPolygon) {
        return;
      }

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

        // refetch graph
        case "r":
          invalidateNodesCache();
          break;

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
          if (nodes) {
            calcMst(nodes, rooms, router, dispatch);
          }
          break;

        // delete or backspace or escape
        case "Backspace":
        case "Delete":
        case "Escape":
          if (nodeIdSelected && nodes) {
            deleteNode(nodes, nodeIdSelected, floorCode, router, dispatch);
          } else {
            toastNodeNotSelectedErr();
          }
          break;

        case "w":
          dispatch(setMode(ADD_DOOR_NODE));
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

        default:
          break;
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
};

export default useKeyboardShortcuts;
