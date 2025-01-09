import { Prisma } from "@prisma/client";
import { InputJsonValue } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";

import { RoomInfo } from "../../../../components/shared/types";
import {
  extractFloorLevelFromRoomName,
  getInfoFromRoomId,
} from "../../../../components/utils/utils";
import prisma from "../../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const roomId = requestData.roomId;
    const room: RoomInfo = requestData.room;

    const { buildingCode, roomName } = getInfoFromRoomId(roomId);
    const floorLevel = extractFloorLevelFromRoomName(roomName);

    //#region Alias handling
    const existingAliases = await prisma.alias.findMany({
      where: {
        buildingCode,
        roomName,
      },
      select: {
        alias: true,
      },
    });

    const existingAliasList = existingAliases.map((a) => a.alias);
    const aliasesToDelete = existingAliasList.filter(
      (alias) => !room.aliases.includes(alias)
    );

    const aliasesToCreate = room.aliases.filter(
      (alias) => !existingAliasList.includes(alias)
    );
    //#endregion

    const upsertData = {
      buildingCode,
      floorLevel,
      name: room.name,
      labelPosX: room.labelPosition.x,
      labelPosY: room.labelPosition.y,
      type: room.type,
      displayAlias: room.displayAlias,
      polygon: room.polygon as unknown as InputJsonValue,
    };

    const newRoom = await prisma.room.upsert({
      where: {
        buildingCode_name: { buildingCode, name: roomName },
      },
      create: {
        ...upsertData,
        aliases: {
          createMany: {
            data: aliasesToCreate.map((alias) => ({ alias })),
          },
        },
      },
      update: {
        ...upsertData,
        aliases: {
          deleteMany: {
            alias: {
              in: aliasesToDelete,
            },
          },
          createMany: {
            data: aliasesToCreate.map((alias) => ({ alias })),
          },
        },
      },
      select: {
        updatedAt: true,
      },
    });

    const updatedAt = newRoom.updatedAt;

    // good response
    return new NextResponse(JSON.stringify({ status: 200, updatedAt }));
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
