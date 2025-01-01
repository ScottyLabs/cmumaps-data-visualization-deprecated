import React, { useContext } from "react";
import { Line } from "react-konva";

import { OutlineContext } from "../contexts/OutlineProvider";

const WallsDisplay = () => {
  const { walls } = useContext(OutlineContext);

  return walls.map((points: number[], index: number) => (
    <Line key={index} points={points} stroke="black" strokeWidth={1} />
  ));
};

export default WallsDisplay;
