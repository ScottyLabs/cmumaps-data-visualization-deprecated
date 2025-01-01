import { GRAPH_SELECT, setMode } from "../../lib/features/modeSlice";
import { DefaultIdSelected } from "../contexts/IdEventsTypes";
import { dist, savingHelper } from "../utils/utils";
import { Edge } from "./types";

export const deleteNode = async (
  nodes,
  nodeId,
  setNodes,
  floorCode,
  setSaveStatus,
  setIdSelected,
  router,
  dispatch
) => {
  router.push(floorCode);

  setIdSelected(DefaultIdSelected);
  dispatch(setMode(GRAPH_SELECT));

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
