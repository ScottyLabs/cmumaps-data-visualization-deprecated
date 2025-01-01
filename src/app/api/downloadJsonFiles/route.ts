import { NextResponse } from "next/server";
import archiver from "archiver";
import { getTopJSONDirPath } from "../apiUtils";

export async function GET() {
  try {
    const jsonDirPath = getTopJSONDirPath();

    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level.
    });

    const stream = new ReadableStream({
      start(controller) {
        archive.on("data", (chunk) => controller.enqueue(chunk));
        archive.on("end", () => controller.close());
        archive.on("error", (err) => controller.error(err));
      },
    });

    archive.directory(jsonDirPath, false);
    archive.finalize();

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=jsonFiles.zip",
      },
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
