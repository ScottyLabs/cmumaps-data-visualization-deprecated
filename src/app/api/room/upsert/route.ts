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
    const oldRoom: RoomInfo | undefined = requestData.oldRoom;
    const newRoom: RoomInfo = requestData.newRoom;

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
      (alias) => !newRoom.aliases.includes(alias)
    );

    const aliasesToCreate = newRoom.aliases.filter(
      (alias) => !existingAliasList.includes(alias)
    );
    //#endregion

    const upsertData = {
      buildingCode,
      floorLevel,
      name: newRoom.name,
      labelPosX: newRoom.labelPosition.x,
      labelPosY: newRoom.labelPosition.y,
      type: newRoom.type,
      displayAlias: newRoom.displayAlias,
      polygon: newRoom.polygon as unknown as InputJsonValue,
    };

    const dbRoom = await prisma.room.upsert({
      where: {
        buildingCode_name: { buildingCode, name: oldRoom?.name || "" },
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

    // good response
    return new NextResponse(
      JSON.stringify({ status: 200, updatedAt: dbRoom.updatedAt })
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
