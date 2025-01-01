import { toast } from "react-toastify";

import { DefaultIdSelected } from "../contexts/IdEventsTypes";
import {
  ADD_DOOR_NODE,
  ADD_EDGE,
  ADD_NODE,
  DELETE_EDGE,
  GRAPH_SELECT,
  POLYGON_ADD_VERTEX,
  POLYGON_DELETE_VERTEX,
} from "../contexts/ModeProvider";
import { dist, savingHelper } from "../utils/utils";
import { Edge } from "./types";

export const setModePolygonDeleteVertex = (setMode) => {
  setMode(POLYGON_DELETE_VERTEX);
  toast.info("Click on vertex to delete it!");
};

export const setModePolygonAddVertex = (setMode) => {
  setMode(POLYGON_ADD_VERTEX);
  toast.info("Click to add a vertex!");
};

export const setModeAddNode = (setMode) => {
  setMode(ADD_NODE);
  toast.info("Click to add a node!");
};

export const setModeAddDoorNode = (setMode) => {
  setMode(ADD_DOOR_NODE);
  toast.info("Click on a purple door to add a door node!");
};

export const setModeAddEdge = (setMode) => {
  setMode(ADD_EDGE);
  toast.info("Click on another node to add an edge!");
};

export const setModeDeleteEdge = (setMode) => {
  setMode(DELETE_EDGE);
  toast.info("Click on another node to delete an edge!");
};

export const deleteNode = async (
  nodes,
  nodeId,
  setNodes,
  floorCode,
  setMode,
  setSaveStatus,
  setIdSelected,
  router
) => {
  router.push(floorCode);

  setIdSelected(DefaultIdSelected);
  setMode(GRAPH_SELECT);

  const newNodes = { ...nodes };

  // connect the two neighbor nodes if possible
  if (Object.values(newNodes[nodeId].neighbors).length == 2) {
    const neighbors = Object.keys(newNodes[nodeId].neighbors);
    const node0 = newNodes[neighbors[0]];
    const node1 = newNodes[neighbors[1]];

    // make sure both neighbors are not deleted already
    if (node0 && node1) {
      const curDist = dist(node0.pos, node1.pos);
      node0.neighbors[neighbors[1]] = { dist: curDist };
      node1.neighbors[neighbors[0]] = { dist: curDist };
    }
  }

  // delete the edge to another floor
  for (const neighborId in newNodes[nodeId].neighbors) {
    const neighbor: Edge = newNodes[nodeId].neighbors[neighborId];
    if (neighbor.toFloorInfo) {
      const response = await fetch("/api/updateEdgeAcrossFloors", {
        method: "POST",
        body: JSON.stringify({
          floorCode: neighbor.toFloorInfo.toFloor,
          nodeId: neighborId,
          neighborId: nodeId,
        }),
      });

      const body = await response.json();

      // handle error
      if (!response.ok) {
        console.error(body.error);
      }
    }
  }

  delete newNodes[nodeId];

  for (const curNodeId in newNodes) {
    if (Object.keys(newNodes[curNodeId].neighbors).includes(nodeId)) {
      delete newNodes[curNodeId].neighbors[nodeId];
    }
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
};
