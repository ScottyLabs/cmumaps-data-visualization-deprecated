import { NextResponse } from "next/server";

import { Edge, Nodes, ID } from "../../../components/shared/types";
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
    const dbNodes = await prisma.node.findMany({
      where: {
        room: {
          buildingCode: buildingCode,
          floorLevel: floorLevel,
        },
      },
      include: {
        room: true,
        outNeighbors: {
          include: {
            outNode: {
              include: {
                room: true,
              },
            },
          },
        },
      },
    });

    const nodes: Nodes = {};

    for (const node of dbNodes) {
      const neighbors: Record<ID, Edge> = {};

      // Process outNeighbors
      for (const neighbor of node.outNeighbors) {
        const outNode = neighbor.outNode;
        neighbors[outNode.id] = {};

        // Check if the node and neighbor are on different floors
        if (
          node.room?.buildingCode !== outNode.room?.buildingCode ||
          node.room?.floorLevel !== outNode.room?.floorLevel
        ) {
          let toFloorType = "";
          if (node.room?.type === outNode.room?.type) {
            toFloorType = node.room?.type || "";
          }
          neighbors[outNode.id].toFloorInfo = {
            toFloor: `${outNode.room?.buildingCode}-${outNode.room?.floorLevel}`,
            type: toFloorType,
          };
        }
      }

      let roomId = "";
      if (node.room) {
        roomId = getRoomId(node.room);
      }

      nodes[node.id] = {
        pos: { x: node.posX, y: node.posY },
        neighbors,
        roomId,
      };
    }

    return new NextResponse(JSON.stringify({ data: nodes }), {
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
