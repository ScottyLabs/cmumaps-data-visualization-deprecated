import { NextResponse } from "next/server";

import { Edge, Graph, ID } from "../../../components/shared/types";
import prisma from "../../../lib/prisma";
import { extractBuildingCode, extractFloorLevel } from "../apiUtils";

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
          status: 500,
        }
      );
    }

    const buildingCode = extractBuildingCode(floorCode);
    const floorLevel = extractFloorLevel(floorCode);

    // fetch all nodes from the database for this floor
    const nodes = await prisma.node.findMany({
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

    const graph: Graph = {};

    for (const node of nodes) {
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
        roomId = `${buildingCode}-${node.room.name}`;
      }

      graph[node.id] = {
        pos: { x: node.posX, y: node.posY },
        neighbors,
        roomId,
        locked: 0,
        overwrites: [],
      };
    }

    return new NextResponse(
      JSON.stringify({
        data: graph,
      }),
      {
        status: 200,
      }
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
