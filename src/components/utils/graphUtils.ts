import { PriorityQueue } from "@datastructures-js/priority-queue";
import { Dispatch } from "@reduxjs/toolkit";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { toast } from "react-toastify";

import { setMst } from "../../lib/features/dataSlice";
import { Graph, ID, Mst, Rooms } from "../shared/types";
import { dist } from "./utils";

// calculate mst for each connected components of the graph
export const calcMst = (
  nodes: Graph,
  rooms: Rooms,
  router: AppRouterInstance,
  dispatch: Dispatch
) => {
  // MST is a set of edges (inNodeId, outNodeId)
  const mst: Mst = {};
  const visited: Set<string> = new Set();
  const pq = new PriorityQueue<{ value: [string, string]; priority: number }>(
    (a, b) => a.priority - b.priority
  );

  // Helper function to add edges to priority queue from a node
  const addEdgesToQueue = (nodeId: string) => {
    const edges = nodes[nodeId].neighbors;
    for (const neighborId in edges) {
      if (!visited.has(neighborId)) {
        // don't add node belonging a different floor
        if (edges[neighborId].toFloorInfo) {
          continue;
        }

        pq.enqueue({
          value: [nodeId, neighborId],
          priority: edges[neighborId].dist,
        });
      }
    }
  };

  // pick a random node to start Prim's
  const randomNode =
    Object.keys(nodes)[Math.floor(Math.random() * Object.keys(nodes).length)];
  addEdgesToQueue(randomNode);
  visited.add(randomNode);

  // Continue until the queue is empty or all nodes are visited
  while (!pq.isEmpty()) {
    const {
      value: [inNodeId, outNodeId],
    } = pq.dequeue();

    if (visited.has(outNodeId)) {
      continue;
    }

    // Add edge to MST
    if (!mst[inNodeId]) {
      mst[inNodeId] = {};
    }
    mst[inNodeId][outNodeId] = true;
    visited.add(outNodeId);

    // Add edges from the newly added node to the priority queue
    addEdgesToQueue(outNodeId);
  }

  // return the closest node to the MST
  let nodeNotInMst: ID | null = null;
  let minDist = 0;
  for (const nodeId in nodes) {
    if (!visited.has(nodeId)) {
      const room = rooms[nodes[nodeId].roomId];
      if (room.type != "Inaccessible") {
        const curDist = Array.from(visited).reduce(
          (min, visitedNodeId) =>
            Math.min(min, dist(nodes[nodeId].pos, nodes[visitedNodeId].pos)),
          Infinity
        );
        if (!nodeNotInMst || curDist < minDist) {
          nodeNotInMst = nodeId;
          minDist = curDist;
        }
      }
    }
  }

  if (nodeNotInMst) {
    toast.error("MST not complete!");
    router.push(`?nodeId=${nodeNotInMst}`);
  } else {
    toast.success("Found MST!");
  }

  dispatch(setMst(mst));
};

export const addDoorNodeErrToast = () => {
  toast.error("Click on a purple door to add a door node!");
};
