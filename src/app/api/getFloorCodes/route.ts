import { NextResponse } from "next/server";
import fs from "fs/promises";
import { getPDFDirPath } from "../apiUtils";
import path from "path";
import { floorCodeOrder } from "./floorCodeOrder";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buildingCode = searchParams.get("buildingCode");

    if (!buildingCode) {
      return new NextResponse(
        JSON.stringify({
          error: "Need Building Code!",
        }),
        {
          status: 500,
        }
      );
    }

    const pdfFolderPath = getPDFDirPath();

    const folders = await fs.readdir(path.join(pdfFolderPath, buildingCode));

    const newFloorLevels = folders.filter((name) => name != ".DS_Store");

    const getFloorLevel = (f: string) => {
      f = f.replace(".pdf", "");
      const farr = f.split("-");
      return farr[farr.length - 1];
    };

    const sortFloorLevels = (floorLevels: string[]) => {
      const floorLevelSort = (f1: string, f2: string) => {
        return floorCodeOrder.indexOf(f2) - floorCodeOrder.indexOf(f1);
      };

      return floorLevels.sort(floorLevelSort);
    };

    return new NextResponse(
      JSON.stringify({
        newFloorLevels: sortFloorLevels(
          newFloorLevels.map((floorCode) => getFloorLevel(floorCode))
        ),
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
