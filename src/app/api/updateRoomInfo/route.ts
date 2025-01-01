import { NextResponse } from "next/server";
import fs from "fs";
import { readFileSync } from "fs";
import { getOutlineJsonFilePath } from "../apiUtils";

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const floorCode = requestData.floorCode;
    const newRoomInfo = requestData.newRoomInfo;
    const roomId = requestData.roomId;

    // check if can read from already calculated json file
    const jsonFilePath = getOutlineJsonFilePath(floorCode);

    const data = await JSON.parse(readFileSync(jsonFilePath, "utf8"));
    data["rooms"][roomId] = newRoomInfo;

    fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 4));

    return new NextResponse(
      JSON.stringify({
        status: 200,
      })
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
