import Konva from "konva";

import { toast } from "react-toastify";

import { PDFCoordinate } from "../shared/types";

export const setCursor = (e, cursor) => {
  const curStage = e.target.getStage();
  if (curStage != null) {
    const container = curStage.container();
    container.style.cursor = cursor;
  }
};

/**
 * @param e Konva event
 * @param offset
 * @param scale
 * @returns the cursor position (relative?, absolute?, need to figure out?)
 */
export const getCursorPos = (
  e: Konva.KonvaEventObject<MouseEvent>,
  offset: PDFCoordinate,
  scale: number,
  callback: (pos: PDFCoordinate) => void
) => {
  const pos = e.target.getStage()?.getPointerPosition();
  if (!pos) {
    toast.error("Unable to get cursor position!");
    return;
  }
  callback({
    x: Number(((pos.x - offset.x) / scale).toFixed(2)),
    y: Number(((pos.y - offset.y) / scale).toFixed(2)),
  });
};
