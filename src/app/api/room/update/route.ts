import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { RoomInfo } from "../../../../components/shared/types";
import {
  getBuildingCodeFromRoomId,
  getRoomNameFromRoomId,
} from "../../../../components/utils/utils";
import prisma from "../../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const roomId = requestData.roomId;
    const roomData: RoomInfo = requestData.roomData;

    await prisma.room.update({
      where: {
        buildingCode_name: {
          buildingCode: getBuildingCodeFromRoomId(roomId),
          name: getRoomNameFromRoomId(roomId),
        },
      },
      data: {
        name: roomData.name,
      },
    });

    // good response
    return new NextResponse(
      JSON.stringify({
        status: 200,
      })
    );
  } catch (e) {
    // console.log(e);
    let errorMessage = "";
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code == "P2002") {
        errorMessage = "Room Name already exists!";
      }
    }
    return new NextResponse(
      JSON.stringify({
        error: String(e),
        // error: String(e.stack),
        errorMessage,
      }),
      {
        status: 500,
      }
    );
  }
}
