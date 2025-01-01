import { NextResponse } from "next/server";
import fs from "fs";
import { readFile } from "fs/promises";
import { getGraphJsonFilePath } from "../apiUtils";
import { Node, ToFloorInfo } from "../../../components/shared/types";

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const floorCode = requestData.floorCode;
    const nodeId = requestData.nodeId;
    const neighborId = requestData.neighborId;
    const newToFloorInfo: ToFloorInfo = requestData.newToFloorInfo;

    const graphFilePath = getGraphJsonFilePath(floorCode);
    const graph = JSON.parse(await readFile(graphFilePath, "utf8"));
    const node: Node = graph[nodeId];

    if (newToFloorInfo) {
      node.neighbors[neighborId].toFloorInfo = newToFloorInfo;
    } else {
      delete node.neighbors[neighborId];
    }

    fs.writeFileSync(graphFilePath, JSON.stringify(graph, null, 4));

    // good response
    return new NextResponse(
      JSON.stringify({
        status: 200,
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
