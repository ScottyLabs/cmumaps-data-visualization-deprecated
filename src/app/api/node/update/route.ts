import { NextResponse } from "next/server";

import { NodeInfo } from "../../../../components/shared/types";
import {
  getBuildingCodeFromRoomId,
  getRoomNameFromRoomId,
} from "../../../../components/utils/utils";
import prisma from "../../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const nodeId = requestData.nodeId;
    const node: NodeInfo = requestData.node;

    const newNode = await prisma.node.update({
      where: {
        id: nodeId,
      },
      data: {
        posX: node.pos.x,
        posY: node.pos.y,
        buildingCode: getBuildingCodeFromRoomId(node.roomId),
        roomName: getRoomNameFromRoomId(node.roomId),
      },
      select: {
        updatedAt: true,
      },
    });

    const updatedAt = newNode.updatedAt;

    // good response
    return new NextResponse(
      JSON.stringify({
        status: 200,
        updatedAt,
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
