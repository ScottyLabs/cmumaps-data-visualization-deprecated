import { exec } from "child_process";
import { NextResponse } from "next/server";
import { promisify } from "util";

export async function POST(request: Request) {
  try {
    const requestData = await request.json();

    const roomId = requestData.roomId;
    // need to stringify twice for escape characters
    // https://stackoverflow.com/questions/5506000/json-stringify-doesnt-escape
    const room = JSON.stringify(JSON.stringify(requestData.room));
    const density = requestData.density;

    const execPromise = promisify(exec);

    const { stdout, stderr } = await execPromise(
      `python3 public/python/api/walkway_detection.py ${roomId} ${room} ${density}`
    );

    // Python Error Message
    if (stderr) {
      return new NextResponse(
        JSON.stringify({
          error: stderr,
        }),
        {
          status: 500,
        }
      );
    }

    // const graphJsonFilePath = getGraphJsonFilePath(floorCode);

    // combine graphs
    // const oldGraph = await readFile(graphJsonFilePath, "utf8");
    // const oldGraphJSON = JSON.parse(oldGraph);

    // const deletedNodeIds: ID[] = [];

    // // delete walkways nodes
    // for (const nodeId in oldGraphJSON) {
    //   const curNode: Node = oldGraphJSON[nodeId];

    //   if (curNode.roomId == roomId) {
    //     delete oldGraphJSON[nodeId];
    //     deletedNodeIds.push(nodeId);
    //   }
    // }

    // // delete their neighbors
    // for (const nodeId in oldGraphJSON) {
    //   const curNode: Node = oldGraphJSON[nodeId];

    //   for (const neighbor in curNode.neighbors) {
    //     if (deletedNodeIds.includes(neighbor)) {
    //       delete curNode.neighbors[neighbor];
    //     }
    //   }
    // }

    const newGraphJSON = JSON.parse(stdout);

    // good response
    return new NextResponse(JSON.stringify({ nodes: newGraphJSON }), {
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
