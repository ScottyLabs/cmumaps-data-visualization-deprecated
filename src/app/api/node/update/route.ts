import { NextResponse } from "next/server";

import { Node } from "../../../../components/shared/types";
import {
  getBuildingCodeFromRoomId,
  getRoomNameFromRoomId,
} from "../../../../components/utils/utils";
import prisma from "../../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const nodeId = requestData.nodeId;
    const nodeData: Node = requestData.nodeData;

    await prisma.node.update({
      where: {
        id: nodeId,
      },
      data: {
        posX: nodeData.pos.x,
        posY: nodeData.pos.y,
        buildingCode: getBuildingCodeFromRoomId(nodeData.roomId),
        roomName: getRoomNameFromRoomId(nodeData.roomId),
      },
    });

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
