import { NextResponse } from "next/server";

import { EdgeInfo, Graph, ID } from "../../../components/shared/types";
import { dist } from "../../../components/utils/utils";
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
      const neighbors: Record<ID, EdgeInfo> = {};

      // Process outNeighbors
      for (const neighbor of node.outNeighbors) {
        const outNode = neighbor.outNode;
        const distance = dist(
          { x: node.posX, y: node.posY },
          { x: outNode.posX, y: outNode.posY }
        );

        neighbors[outNode.id] = { dist: distance };

        // Check if the node and neighbor are on different floors
        if (
          node.room?.buildingCode !== outNode.room?.buildingCode ||
          node.room?.floorLevel !== outNode.room?.floorLevel
        ) {
          let toFloorType = "";
          if (node.room?.type === outNode.room?.type) {
            toFloorType = node.room?.type || "";
          }

          neighbors[outNode.id].dist = -1;
          neighbors[outNode.id].toFloorInfo = {
            toFloor: `${outNode.room?.buildingCode}-${outNode.room?.floorLevel}`,
            type: toFloorType,
          };
        }
      }

      let roomId = "";
      if (node.room) {
        roomId = `${buildingCode}-${node.room?.name}`;
      }

      graph[node.id] = {
        pos: { x: node.posX, y: node.posY },
        neighbors,
        roomId,
      };
    }

    return new NextResponse(
      JSON.stringify({
        result: graph,
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
