import { NextResponse } from "next/server";

import { EdgeInfo, Nodes, ID } from "../../../components/shared/types";
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
        element: {
          buildingCode: buildingCode,
          floorLevel: floorLevel,
        },
      },
      include: {
        element: {
          include: {
            room: true,
          },
        },
        outNeighbors: {
          include: {
            outNode: {
              include: {
                element: true,
              },
            },
          },
        },
      },
    });

    const nodes: Nodes = {};

    for (const node of dbNodes) {
      const neighbors: Record<ID, EdgeInfo> = {};

      // Process outNeighbors
      for (const neighbor of node.outNeighbors) {
        const outNode = neighbor.outNode;
        neighbors[outNode.id] = {};

        // Check if the node and neighbor are on different floors
        if (
          node.element.buildingCode !== outNode.element.buildingCode ||
          node.element.floorLevel !== outNode.element.floorLevel
        ) {
          let toFloorType = "";
          if (node.element.type === outNode.element.type) {
            toFloorType = node.element.type || "";
          }
          neighbors[outNode.id].toFloorInfo = {
            toFloor: `${outNode.element.buildingCode}-${outNode.element.floorLevel}`,
            type: toFloorType,
          };
        }
      }

      let roomId = "";
      if (node.element.room) {
        roomId = getRoomId(node.element.room);
      }

      nodes[node.id] = {
        pos: { x: node.latitude, y: node.longitude },
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
