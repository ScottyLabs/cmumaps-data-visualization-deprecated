import { Polygon } from "geojson";

import React, { useContext } from "react";
import { Line } from "react-konva";

import { DisplaySettingsContext } from "../contexts/DisplaySettingsProvider";
import { NodeSizeContext } from "../contexts/NodeSizeProvider";
import { ID } from "../shared/types";
import PolygonEditor from "./PolygonEditor";

interface Props {
  floorCode: string;
  roomIdSelected: ID;
  polygon: Polygon;
}

const SelectedPolygonDisplay = ({
  floorCode,
  roomIdSelected,
  polygon,
}: Props) => {
  const { editPolygon } = useContext(DisplaySettingsContext);
  const { nodeSize } = useContext(NodeSizeContext);

  if (!polygon) {
    return;
  }

  if (!editPolygon) {
    return polygon.coordinates.map((coords, index) => (
      <Line
        key={index}
        points={coords.flat()}
        stroke="orange"
        strokeWidth={nodeSize / 2}
      />
    ));
  }

  return (
    <PolygonEditor
      floorCode={floorCode}
      roomId={roomIdSelected}
      polygon={polygon}
      nodeSize={nodeSize}
    />
  );
};

export default SelectedPolygonDisplay;
