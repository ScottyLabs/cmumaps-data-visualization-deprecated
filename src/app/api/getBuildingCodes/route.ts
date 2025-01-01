import fs from "fs";
import { readdir } from "fs/promises";
import { NextResponse } from "next/server";

import { getPDFDirPath } from "../apiUtils";

/**
 * @returns All the folder names in /public/pdf
 * @remarks Excludes .DS_Store
 */
export async function GET() {
  try {
    const pdfFolderPath = getPDFDirPath();

    // create pdf dir if it doesn't exist
    if (!fs.existsSync(pdfFolderPath)) {
      fs.mkdirSync(pdfFolderPath);
    }

    const folders = await readdir(pdfFolderPath);

    return new NextResponse(
      JSON.stringify({
        result: folders.filter((name) => name != ".DS_Store"),
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
