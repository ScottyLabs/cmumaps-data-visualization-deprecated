import { exec } from "child_process";
import fs from "fs";
import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
// switch back to spawn if needed
import { promisify } from "util";

import { extractBuildingCode, getOutlineJsonFilePath } from "../apiUtils";

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const floorCode = requestData.floorCode;

    const buildingCode = extractBuildingCode(floorCode);

    const execPromise = promisify(exec);
    const { stdout, stderr } = await execPromise(
      `python3 public/python/api/relink_rooms_and_doors.py ${buildingCode}/${floorCode}`
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

    const newDoors = JSON.parse(stdout);

    const jsonFilePath = getOutlineJsonFilePath(floorCode);

    const floorData = await readFile(jsonFilePath, "utf8");
    const floorDataJSON = JSON.parse(floorData);

    floorDataJSON["doors"] = newDoors["doors"];
    floorDataJSON["roomlessDoors"] = newDoors["roomlessDoors"];

    fs.writeFileSync(jsonFilePath, JSON.stringify(floorDataJSON, null, 4));

    // good response
    return new NextResponse(
      JSON.stringify({
        doors: newDoors["doors"],
        roomlessDoors: newDoors["roomlessDoors"],
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
