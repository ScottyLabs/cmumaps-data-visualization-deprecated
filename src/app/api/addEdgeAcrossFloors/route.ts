import fs from "fs";
import { readFile } from "fs/promises";
import { NextResponse } from "next/server";

import { NodeInfo } from "../../../components/shared/types";
import {
  getNodeIdByRoomId,
  getRoomIdByRoomName,
} from "../../../components/utils/utils";
import { getGraphJsonFilePath, getOutlineJsonFilePath } from "../apiUtils";

const getNodeId2 = (floorCode2, node1, graph2, rooms1, rooms2) => {
  const roomName = rooms1[node1.roomId].name;
  const floorCodeArr = floorCode2.split("-");
  // replace the first character of the original room name with floor level 2
  const roomNameToFind =
    floorCodeArr[floorCodeArr.length - 1] + roomName.slice(1);

  const roomId = getRoomIdByRoomName(roomNameToFind, rooms2);
  return getNodeIdByRoomId(roomId, graph2);
};

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const floorCode1 = requestData.floorCode1;
    const nodeId1 = requestData.nodeId1;
    const floorCode2 = requestData.floorCode2;
    let nodeId2 = requestData.nodeId2;

    const graphFilePath1 = getGraphJsonFilePath(floorCode1);
    const graphFilePath2 = getGraphJsonFilePath(floorCode2);

    // handle when the graph file of the second floor is not generated yet
    if (!fs.existsSync(graphFilePath2)) {
      return new NextResponse(
        JSON.stringify({
          error: "The graph for " + floorCode2 + " is not generated yet!",
        }),
        {
          status: 400,
        }
      );
    }

    const graph2 = JSON.parse(await readFile(graphFilePath2, "utf8"));

    // handle an invalid node id
    if (nodeId2 && !graph2[nodeId2]) {
      return new NextResponse(
        JSON.stringify({
          error: "The node id is invalid!",
        }),
        {
          status: 400,
        }
      );
    }

    const graph1 = JSON.parse(await readFile(graphFilePath1, "utf8"));

    // get rooms
    const outlineFilePath1 = getOutlineJsonFilePath(floorCode1);
    const outlineFilePath2 = getOutlineJsonFilePath(floorCode2);
    const outline1 = JSON.parse(await readFile(outlineFilePath1, "utf8"));
    const outline2 = JSON.parse(await readFile(outlineFilePath2, "utf8"));
    const rooms1 = outline1["rooms"];
    const rooms2 = outline2["rooms"];

    const node1: NodeInfo = graph1[nodeId1];

    // try autodetect with the name of the room
    if (!nodeId2) {
      nodeId2 = getNodeId2(floorCode2, node1, graph2, rooms1, rooms2);
    }

    if (!nodeId2) {
      return new NextResponse(
        JSON.stringify({
          error: "Unable to autodetect!",
        }),
        {
          status: 400,
        }
      );
    }

    const node2: NodeInfo = graph2[nodeId2];

    if (node1.neighbors[nodeId2] || node2.neighbors[nodeId1]) {
      return new NextResponse(
        JSON.stringify({
          error: "Edge already existed!",
        }),
        {
          status: 400,
        }
      );
    }

    let type = "";

    // assign type if the types of the two rooms are the same
    if (
      rooms1[node1.roomId] &&
      rooms2[node2.roomId] &&
      rooms1[node1.roomId].type == rooms2[node2.roomId].type
    ) {
      type = rooms1[graph1[nodeId1].roomId].type;
    }

    node1.neighbors[nodeId2] = {
      toFloorInfo: { toFloor: floorCode2, type: type },
    };

    node2.neighbors[nodeId1] = {
      toFloorInfo: { toFloor: floorCode1, type: type },
    };

    fs.writeFileSync(graphFilePath1, JSON.stringify(graph1, null, 4));
    fs.writeFileSync(graphFilePath2, JSON.stringify(graph2, null, 4));

    // good response
    return new NextResponse(
      JSON.stringify({
        status: 200,
        newGraph: graph1,
        message: "Edge added successfully!",
      })
    );
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
