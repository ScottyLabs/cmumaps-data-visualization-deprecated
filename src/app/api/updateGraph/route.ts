import { NextResponse } from "next/server";
import fs from "fs";
import { getGraphJsonFilePath } from "../apiUtils";

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const floorCode = requestData.floorCode;
    const newGraph = requestData.newGraph;

    const jsonFilePath = getGraphJsonFilePath(floorCode);
    fs.writeFileSync(
      jsonFilePath,
      JSON.stringify(JSON.parse(newGraph), null, 4)
    );

    // good response
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
