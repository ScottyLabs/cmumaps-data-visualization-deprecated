import React from "react";
import { Line } from "react-konva";

import { useAppSelector } from "../../lib/hooks";

const WallsDisplay = () => {
  const walls = useAppSelector((state) => state.outline.walls);

  return (
    walls &&
    walls.map((points: number[], index: number) => (
      <Line key={index} points={points} stroke="black" strokeWidth={1} />
    ))
  );
};

export default WallsDisplay;
