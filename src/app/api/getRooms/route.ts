import { Polygon } from "geojson";
import { NextResponse } from "next/server";

import { Rooms, RoomType } from "../../../components/shared/types";
import prisma from "../../../lib/prisma";
import { extractBuildingCode, extractFloorLevel, getRoomId } from "../apiUtils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const floorCode = searchParams.get("floorCode");

    if (!floorCode) {
      return new NextResponse(
        JSON.stringify({
          error: "Need Floor Code!",
        }),
        {
          status: 400,
        }
      );
    }

    const buildingCode = extractBuildingCode(floorCode);
    const floorLevel = extractFloorLevel(floorCode);

    // fetch all nodes from the database for this floor
    const dbRooms = await prisma.room.findMany({
      where: {
        buildingCode: buildingCode,
        floorLevel: floorLevel,
      },
      include: {
        aliases: true,
      },
    });

    const rooms: Rooms = {};
    for (const room of dbRooms) {
      rooms[getRoomId(room)] = {
        name: room.name,
        labelPosition: { x: room.labelPosX, y: room.labelPosY },
        type: room.type as RoomType,
        displayAlias: room.displayAlias ?? undefined,
        aliases: room.aliases.map((aliasEntry) => aliasEntry.alias),
        polygon: room.polygon as unknown as Polygon,
      };
    }

    return new NextResponse(JSON.stringify({ data: rooms }), {
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
