import fs from "fs";
import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

import { Node, DoorInfo } from "../../../components/shared/types";
import { dist } from "../../../components/utils/utils";
import { getGraphJsonFilePath, getOutlineJsonFilePath } from "../apiUtils";
import { AsEdge, AsNode } from "./addDoorToGraphTypes";

const handleRoomDoNotHaveNodeError = async (floorCode, roomId1, roomId2) => {
  const roomId = !roomId1 ? roomId1 : roomId2;

  const outlineFilePath = getOutlineJsonFilePath(floorCode);
  const outline = JSON.parse(await readFile(outlineFilePath, "utf8"));
  const rooms = outline["rooms"];

  return new NextResponse(
    JSON.stringify({
      errorMessage: rooms[roomId].name + " doesn't have a node!",
    }),
    {
      status: 400,
    }
  );
};

export async function POST(request: Request) {
  try {
    const requestData = await request.json();

    const doors: DoorInfo[] = requestData.doorInfos;
    const floorCode = requestData.floorCode;
    const type = requestData.type;

    const jsonFilePath = getGraphJsonFilePath(floorCode);

    const graph = await readFile(jsonFilePath, "utf8");
    const graphJSON = JSON.parse(graph);

    for (const doorInfo of doors) {
      const newNode: Node = {
        pos: doorInfo.center,
        neighbors: {},
        roomId: doorInfo.roomIds[0],
      };

      const roomId1 = doorInfo.roomIds[0];
      const roomId2 = doorInfo.roomIds[1];

      let closestNode1 = "";
      let minDistance1 = -1;

      let closestNode2 = "";
      let minDistance2 = -1;

      // find the two closest nodes
      for (const nodeId in graphJSON) {
        const node: Node = graphJSON[nodeId];
        if (node.roomId == roomId1) {
          const curDist = dist(node.pos, doorInfo.center);
          if (minDistance1 == -1 || curDist < minDistance1) {
            minDistance1 = curDist;
            closestNode1 = nodeId;
          }
        } else if (node.roomId == roomId2) {
          const curDist = dist(node.pos, doorInfo.center);
          if (minDistance2 == -1 || curDist < minDistance2) {
            minDistance2 = curDist;
            closestNode2 = nodeId;
          }
        }
      }

      if (!closestNode1 || !closestNode2) {
        return handleRoomDoNotHaveNodeError(floorCode, roomId1, roomId2);
      }

      // add as a node
      if (type == AsNode) {
        const newNodeId = uuidv4();

        newNode.neighbors[closestNode1] = {
          dist: Number(minDistance1.toFixed(2)),
        };
        graphJSON[closestNode1].neighbors[newNodeId] = {
          dist: Number(minDistance1.toFixed(2)),
        };

        newNode.neighbors[closestNode2] = {
          dist: Number(minDistance2.toFixed(2)),
        };
        graphJSON[closestNode2].neighbors[newNodeId] = {
          dist: Number(minDistance2.toFixed(2)),
        };

        // delete the edge between these two nodes
        delete graphJSON[closestNode1].neighbors[closestNode2];
        delete graphJSON[closestNode2].neighbors[closestNode1];

        graphJSON[newNodeId] = newNode;
      }
      // add as a edge
      else if (type == AsEdge) {
        const newDist = dist(
          graphJSON[closestNode1].pos,
          graphJSON[closestNode2].pos
        );

        graphJSON[closestNode2].neighbors[closestNode1] = { dist: newDist };
        graphJSON[closestNode1].neighbors[closestNode2] = { dist: newDist };
      }
    }

    fs.writeFileSync(jsonFilePath, JSON.stringify(graphJSON, null, 4));

    // good response
    return new NextResponse(JSON.stringify({ nodes: graphJSON }), {
      status: 200,
    });
  } catch (e) {
    // Javascript Error Message
    // console.log(e);
    return new NextResponse(
      JSON.stringify({
        error: String(e),
        // error: String(e.stack),
      }),
      {
        status: 500,
      }
    );
  }
}
