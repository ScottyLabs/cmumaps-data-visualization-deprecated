import { NextResponse } from "next/server";

import prisma from "../../../lib/prisma";

export async function PUT(request: Request) {
  try {
    const requestData = await request.json();
    const inNodeId = requestData.inNodeId;
    const outNodeId = requestData.outNodeId;

    await prisma.neighbor.create({
      data: { inNodeId, outNodeId },
    });

    // good response
    return new NextResponse(JSON.stringify({ status: 200 }));
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

export async function DELETE(request: Request) {
  try {
    const requestData = await request.json();
    const inNodeId = requestData.inNodeId;
    const outNodeId = requestData.outNodeId;

    await prisma.neighbor.delete({
      where: { inNodeId_outNodeId: { inNodeId, outNodeId } },
    });

    // good response
    return new NextResponse(JSON.stringify({ status: 200 }));
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
