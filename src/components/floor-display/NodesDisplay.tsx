import { useRouter } from "next/navigation";

import React, { useContext } from "react";
import { Circle } from "react-konva";
import { toast } from "react-toastify";

import {
  ADD_DOOR_NODE,
  ADD_EDGE,
  DELETE_EDGE,
  GRAPH_SELECT,
  setMode,
} from "../../lib/features/modeSlice";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import { DisplaySettingsContext } from "../contexts/DisplaySettingsProvider";
import { GraphContext } from "../contexts/GraphProvider";
import { IdEventsContext } from "../contexts/IdEventsProvider";
import { NodeSizeContext } from "../contexts/NodeSizeProvider";
import { RoomsContext } from "../contexts/RoomsProvider";
import { SaveStatusContext } from "../contexts/SaveStatusProvider";
import { EdgeTypeList, Node, ID } from "../shared/types";
import { addDoorNodeErrToast } from "../utils/graphUtils";
import { findRoomId } from "../utils/roomUtils";
import {
  dist,
  getNodeIdSelected,
  getRoomId,
  savingHelper,
  setCursor,
} from "../utils/utils";

interface Props {
  floorCode: string;
  updateMyPresenceWrapper;
  setNodeIdOnDrag;
}

const NodesDisplay = ({
  floorCode,
  updateMyPresenceWrapper,
  setNodeIdOnDrag,
}: Props) => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const mode = useAppSelector((state) => state.mode.mode);
  const setSaveStatus = useContext(SaveStatusContext);

  const { rooms } = useContext(RoomsContext);
  const { nodes, setNodes } = useContext(GraphContext);
  const { nodeSize } = useContext(NodeSizeContext);
  const { showRoomSpecific } = useContext(DisplaySettingsContext);
  const { idSelected, nodeIdHovered } = useContext(IdEventsContext);
  const roomIdSelected = getRoomId(nodes, idSelected);

  const getFillColor = (nodeId: ID) => {
    const nodeIdSelected = getNodeIdSelected(idSelected);
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
      rooms[nodes[nodeId].roomId].type == "inaccessible"
    ) {
      return "gray";
    }

    return "blue";
  };

  const handleNodeClick = (nodeId: ID) => {
    if (mode == GRAPH_SELECT) {
      router.push(`${floorCode}?nodeId=${nodeId}`);
    } else if (mode == ADD_EDGE) {
      const nodeIdSelected = getNodeIdSelected(idSelected);

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

      setNodes(newNodes);

      savingHelper(
        "/api/updateGraph",
        JSON.stringify({
          floorCode: floorCode,
          newGraph: JSON.stringify(newNodes),
        }),
        setSaveStatus
      );

      dispatch(setMode(GRAPH_SELECT));
    } else if (mode == DELETE_EDGE) {
      const nodeIdSelected = getNodeIdSelected(idSelected);

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

      setNodes(newNodes);

      savingHelper(
        "/api/updateGraph",
        JSON.stringify({
          floorCode: floorCode,
          newGraph: JSON.stringify(newNodes),
        }),
        setSaveStatus
      );

      dispatch(setMode(GRAPH_SELECT));
    } else if (mode == ADD_DOOR_NODE) {
      addDoorNodeErrToast();
    }
  };

  const handleOnDragEnd = (e, nodeId) => {
    updateMyPresenceWrapper({ onDragNodeId: null });
    setNodeIdOnDrag("");

    const newNodes = { ...nodes };
    const newNode = JSON.parse(JSON.stringify(newNodes[nodeId]));

    newNode.pos = {
      x: Number(e.target.x().toFixed(2)),
      y: Number(e.target.y().toFixed(2)),
    };

    newNode.roomId = findRoomId(rooms, newNode.pos);

    for (const neighborId in newNode.neighbors) {
      // don't modify distance for edge across floors
      if (!newNode.neighbors[neighborId].toFloorInfo) {
        const newDist = dist(newNode.pos, newNodes[neighborId].pos);
        newNode.neighbors[neighborId] = { dist: newDist };
        newNodes[neighborId].neighbors[nodeId] = { dist: newDist };
      }
    }

    newNodes[nodeId] = newNode;
    setNodes(newNodes);

    savingHelper(
      "/api/node/update",
      JSON.stringify({
        nodeId: nodeId,
        nodeData: newNode,
      }),
      setSaveStatus
    );
  };

  return Object.entries(nodes).map(
    ([nodeId, node]: [ID, Node], index: number) => {
      if (!showRoomSpecific || node.roomId == roomIdSelected) {
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
            onDragStart={() => {
              updateMyPresenceWrapper({ onDragNodeId: nodeId });
              setNodeIdOnDrag(nodeId);
            }}
            onDragEnd={(e) => handleOnDragEnd(e, nodeId)}
            onDragMove={(e) => {
              updateMyPresenceWrapper({
                cursor: {
                  x: Number(e.currentTarget.x().toFixed(2)),
                  y: Number(e.currentTarget.y().toFixed(2)),
                },
                nodePos: {
                  x: Number(e.target.x().toFixed(2)),
                  y: Number(e.target.y().toFixed(2)),
                },
              });
            }}
          />
        );
      }
    }
  );
};

export default NodesDisplay;
