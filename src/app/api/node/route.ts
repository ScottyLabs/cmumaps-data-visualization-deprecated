import { NextRequest, NextResponse } from "next/server";

import { NodeInfo } from "../../../components/shared/types";
import {
  getBuildingCodeFromRoomId,
  getRoomNameFromRoomId,
} from "../../../components/utils/utils";
import prisma from "../../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get("nodeId");

    if (!nodeId) {
      return new NextResponse(
        JSON.stringify({ error: "Please include node id!" }),
        { status: 400 }
      );
    }

    const node = await prisma.node.findUnique({
      where: { id: nodeId },
      include: { room: true },
    });

    // good response
    return new NextResponse(JSON.stringify({ status: 200, data: { node } }));
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

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const nodeId = requestData.nodeId;
    const node: NodeInfo = requestData.node;

    const updateData: Record<string, unknown> = {
      posX: node.pos.x,
      posY: node.pos.y,
      buildingCode: getBuildingCodeFromRoomId(node.roomId),
      roomName: getRoomNameFromRoomId(node.roomId),
    };

    if (!node.roomId) {
      delete updateData.buildingCode;
      delete updateData.roomName;
    }

    await prisma.node.update({
      where: {
        id: nodeId,
      },
      data: updateData,
    });

    // good response
    return new NextResponse(JSON.stringify({ status: 200 }));
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
