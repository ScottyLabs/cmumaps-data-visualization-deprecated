import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getPDFDirPath } from "../apiUtils";

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const fileName = requestData.fileName;
    const file = requestData.file;

    const floorPDFDirectory = path.join(
      getPDFDirPath(),
      fileName.split("-")[0]
    );

    // create floor pdf directory if it doesn't exist
    if (!fs.existsSync(floorPDFDirectory)) {
      fs.mkdirSync(floorPDFDirectory);
    }

    const filePath = path.join(floorPDFDirectory, fileName);

    const uint8Array = Buffer.from(file, "base64");

    fs.writeFile(filePath, uint8Array, (err) => {
      if (err) {
        console.error("Error creating file:", err);
        return;
      }

      console.log("File created successfully:", filePath);
    });

    // Send a response with the file path
    return new NextResponse(
      JSON.stringify({
        status: 200,
      })
    );
  } catch (error) {
    console.log(error);
    return new NextResponse(
      JSON.stringify({
        error: "Error saving file",
      }),
      {
        status: 500,
      }
    );
  }
}
