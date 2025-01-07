import Konva from "konva";

import React, { useRef, useState } from "react";

import { useAppSelector } from "../../lib/hooks";
import FloorDisplay from "../floor-display/FloorDisplay";
import { PDFCoordinate } from "../shared/types";
import PDFViewer from "./PdfViewer";

interface Props {
  floorCode: string;
}

const SCALE_BY = 1.05;
const MIN_SCALE = 1;
const MAX_SCALE = 20;

/**
 * Handles zooming and panning for PDF and Canvas
 */
const ZoomPanWrapper = ({ floorCode }: Props) => {
  const showFile = useAppSelector((state) => state.visibility.showFile);

  const [canPan, setCanPan] = useState<boolean>(false);

  const stageRef = useRef<Konva.Stage>(null);
  const [scale, setScale] = useState<number>(1);
  const [offset, setOffset] = useState<PDFCoordinate>({ x: 0, y: 0 });

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    // only scale if stage and pointer are defined
    const stage = stageRef.current;
    if (stage == null) {
      return;
    }

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (pointer == null) {
      return;
    }

    // calculate the new scale
    let newScale = e.evt.deltaY < 0 ? oldScale * SCALE_BY : oldScale / SCALE_BY;

    // clamp the scale
    newScale = Math.max(newScale, MIN_SCALE);
    newScale = Math.min(newScale, MAX_SCALE);
    setScale(newScale);

    // calculate the offset
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    setOffset({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (canPan) {
      setOffset({
        x: e.target.x(),
        y: e.target.y(),
      });
    }
  };

  return (
    <>
      {/* PDFViewer can't be absolute so the zoom buttons can be displayed */}
      <div className="ml-52 mt-24 h-screen overflow-hidden">
        {showFile && (
          <PDFViewer floorCode={floorCode} scale={scale} offset={offset} />
        )}
      </div>
      <div className="absolute inset-0 z-10 ml-52 mt-24 overflow-hidden">
        <FloorDisplay
          floorCode={floorCode}
          setCanPan={setCanPan}
          handleWheel={handleWheel}
          handleDragMove={handleDragMove}
          scale={scale}
          offset={offset}
          stageRef={stageRef}
        />
      </div>
    </>
  );
};

export default ZoomPanWrapper;
