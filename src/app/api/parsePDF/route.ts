import { exec } from "child_process";
import fs from "fs";
import { readFile } from "fs/promises";
import { Polygon } from "geojson";
import { NextResponse } from "next/server";
// switch back to spawn if needed
import { promisify } from "util";

import { Rooms, RoomType } from "../../../components/shared/types";
import prisma from "../../../lib/prisma";
import { ALWAYS_REGENERATE } from "../../../settings";
import {
  extractBuildingCode,
  extractFloorLevel,
  getGraphJsonFilePath,
  getJSONDirPath,
  getOutlineJsonFilePath,
  getTopJSONDirPath,
} from "../apiUtils";

const getRooms = async (buildingCode, floorLevel) => {
  const dbRooms = await prisma.room.findMany({
    where: {
      buildingCode,
      floorLevel,
    },
    include: {
      aliases: true,
    },
  });

  // Transform the data to match the desired JSON structure
  const rooms: Rooms = {};

  for (const room of dbRooms) {
    const roomId = `${buildingCode}-${room.name}`;
    const aliases = room.aliases.map((alias) => alias.alias);

    rooms[roomId] = {
      name: room.name,
      type: room.type as RoomType,
      displayAlias: room.displayAlias || "",
      aliases,
      labelPosition: {
        x: room.labelPosX,
        y: room.labelPosY,
      },
      polygon: room.polygon as unknown as Polygon,
    };
  }

  return rooms;
};

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const floorCode = requestData.floorCode;
    const regenerate = requestData.regenerate;

    const buildingCode = extractBuildingCode(floorCode);
    const floorLevel = extractFloorLevel(floorCode);

    // check if can read from already calculated json file
    const jsonFilePath = getOutlineJsonFilePath(floorCode);

    if (!ALWAYS_REGENERATE && !regenerate && fs.existsSync(jsonFilePath)) {
      const data = await readFile(jsonFilePath, "utf8");

      // extra fields to let frontend know how data is retrieved
      const parsedData = JSON.parse(data);
      parsedData["calculated"] = true;
      delete parsedData["floorCodeDNE"];

      parsedData["rooms"] = await getRooms(buildingCode, floorLevel);

      return new NextResponse(
        JSON.stringify({
          result: parsedData,
        }),
        {
          status: 200,
        }
      );
    }

    // spawn a Python process to parse the pdf
    const execPromise = promisify(exec);
    const { stdout: stdout, stderr: stderr } = await execPromise(
      `python3 public/python/api/parse_pdf.py ${buildingCode}/${floorCode}.pdf`,
      { maxBuffer: 1024 * 2024 * 5 } // 5 MB
    );

    // Python Error Message
    if (stderr) {
      return new NextResponse(
        JSON.stringify({
          error: stderr,
        }),
        {
          status: 500,
        }
      );
    }

    const parsedJSON = JSON.parse(stdout);

    // create json directory if it doesn't exist
    const jsonDir = getTopJSONDirPath();
    if (!fs.existsSync(jsonDir)) {
      fs.mkdirSync(jsonDir);
    }

    // create floor json directory if it doesn't exist
    const floorDir = getJSONDirPath(buildingCode);
    if (!fs.existsSync(floorDir)) {
      fs.mkdirSync(floorDir);
    }

    // write graph to -graph.json
    const graph = parsedJSON.graph;
    fs.writeFileSync(
      getGraphJsonFilePath(floorCode),
      JSON.stringify(graph, null, 4)
    );

    // write output without graph to .json
    delete parsedJSON.graph;
    fs.writeFileSync(jsonFilePath, JSON.stringify(parsedJSON, null, 4));

    // good response
    return new NextResponse(
      JSON.stringify({
        result: parsedJSON,
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
