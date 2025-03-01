import { NextResponse } from "next/server";

import prisma from "../../../lib/prisma";

export async function GET() {
  try {
    const buildings = prisma.building.findMany();

    return new NextResponse(
      JSON.stringify({ status: 200, data: { buildings } })
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
