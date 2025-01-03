import { PriorityQueue } from "@datastructures-js/priority-queue";
import { Dispatch } from "@reduxjs/toolkit";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { toast } from "react-toastify";

import { setMst } from "../../lib/features/dataSlice";
import { Graph, ID, Mst, Rooms } from "../shared/types";
import { dist } from "./utils";

export const removeOverlappingsNodes = (nodes: Graph, nodeSize: number) => {
  const nodeIds = Object.keys(nodes);

  const newNodes = { ...nodes };

  const nodeIdsRemoved: string[] = [];

  for (let i = 0; i < nodeIds.length; i++) {
    const nodeId = nodeIds[i];
    const p1 = nodes[nodeId].pos;
    for (const j of nodeIds.slice(i + 1)) {
      if (dist(p1, nodes[j].pos) < nodeSize * 2) {
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
        delete newNodes[nodeId];
        nodeIdsRemoved.push(nodeId);
        break;
      }
    }
  }

  // remove neighbors
  for (const node of Object.values(nodes)) {
    for (const removedNodeId of nodeIdsRemoved) {
      delete node.neighbors[removedNodeId];
    }
  }

  return newNodes;
};

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
