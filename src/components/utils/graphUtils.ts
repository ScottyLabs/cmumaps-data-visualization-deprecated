import { PriorityQueue } from "@datastructures-js/priority-queue";

import { toast } from "react-toastify";

import { Graph } from "../shared/types";

// calculate mst for each connected components of the graph
export const calcMst = (nodes: Graph) => {
  // MST is a set of edges (inNodeId, outNodeId)
  type Edge = [string, string];
  type MST = Set<[string, string]>;
  const mst: MST = new Set();
  const visited = new Set();
  const pq = new PriorityQueue<{ value: Edge; priority: number }>(
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
    mst.add([inNodeId, outNodeId]);
    visited.add(outNodeId);

    // Add edges from the newly added node to the priority queue
    addEdgesToQueue(outNodeId);
  }

  // return the closest node to the MST if there is any

  console.log(Object.keys(nodes).length);
  console.log(mst);
};

export const addDoorNodeErrToast = () => {
  toast.error("Click on a purple door to add a door node!");
};
