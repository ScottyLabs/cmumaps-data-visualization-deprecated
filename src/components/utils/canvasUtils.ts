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
export const getCursorPos = (e, offset: PDFCoordinate, scale: number) => {
  const pos = e.currentTarget.getPointerPosition();
  return {
    x: Number(((pos.x - offset.x) / scale).toFixed(2)),
    y: Number(((pos.y - offset.y) / scale).toFixed(2)),
  };
};
