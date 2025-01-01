import Konva from "konva";
import dynamic from "next/dynamic";

import React, { useRef, useState } from "react";

import { PDFCoordinate } from "../shared/types";

// import PDFViewer from "./PDFViewer";
const PDFViewer = dynamic(() => import("./PDFViewer"), { ssr: false });

// import FloorDisplay from "./FloorDisplay";
const FloorDisplay = dynamic(() => import("./FloorDisplay"), {
  ssr: false,
});

interface Props {
  floorCode: string;
}

const ZoomPanWrapper = ({ floorCode }: Props) => {
  const [canPan, setCanPan] = useState<boolean>(false);

  const stageRef = useRef<Konva.Stage>(null);
  const [scale, setScale] = useState<number>(1);
  const [offset, setOffset] = useState<PDFCoordinate>({ x: 0, y: 0 });

  const handleWheel = (e) => {
    e.evt.preventDefault();

    const scaleBy = 1.05;
    const stage = stageRef.current;

    if (stage == null) {
      return;
    }

    const oldScale = stage.scaleX();

    const pointer = stage.getPointerPosition();

    if (pointer == null) {
      return;
    }

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    newScale = Math.max(newScale, 1);

    if (newScale >= 1 && newScale < 20) {
      setScale(newScale);
      setOffset({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    }
  };

  const handleDragMove = (e) => {
    if (canPan) {
      setOffset({
        x: e.target.x(),
        y: e.target.y(),
      });
    }
  };

  return (
    <>
      <div className="ml-52 mt-24 h-screen overflow-hidden">
        <PDFViewer floorCode={floorCode} scale={scale} offset={offset} />
      </div>
      <div className="absolute inset-0 z-10 ml-52 mt-24">
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
