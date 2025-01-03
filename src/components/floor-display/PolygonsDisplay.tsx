import { Polygon } from "geojson";
import { Util } from "konva/lib/Util";
import { useRouter } from "next/navigation";

import React, { useContext, useEffect, useState } from "react";
import { Path } from "react-konva";

import { useAppSelector } from "../../lib/hooks";
import { RoomsContext } from "../contexts/RoomsProvider";

const PolygonsDisplay = () => {
  const router = useRouter();
  const nodeSize = useAppSelector((state) => state.ui.nodeSize);
  const showPolygons = useAppSelector((state) => state.visibility.showPolygons);

  const { rooms } = useContext(RoomsContext);

  // get all random colors
  const [fillColors, setFillColors] = useState<string[]>([]);

  const fillColorsLength = Object.keys(rooms).length;
  useEffect(() => {
    setFillColors(
      [...Array(fillColorsLength)].map(() => Util.getRandomColor())
    );
  }, [fillColorsLength, showPolygons]);

  // Convert GeoJSON polygon to SVG path string
  const geojsonToPath = (polygon: Polygon): string => {
    const [outerRing, ...holes] = polygon.coordinates;

    if (outerRing.length == 0) {
      return "";
    }

    // Convert outer ring to SVG path
    let pathString = `M ${outerRing[0][0]},${outerRing[0][1]}`;
    outerRing.slice(1).forEach(([x, y]) => {
      pathString += ` L ${x},${y}`;
    });
    pathString += " Z"; // Close the outer path

    // Convert each hole (inner rings) to SVG path
    holes.forEach((hole) => {
      if (hole.length == 0) {
        return;
      }

      pathString += ` M ${hole[0][0]},${hole[0][1]}`;
      hole.slice(1).forEach(([x, y]) => {
        pathString += ` L ${x},${y}`;
      });
      pathString += " Z"; // Close the hole path
    });

    return pathString;
  };

  return Object.entries(rooms).map(([roomId, room], colorIndex) => {
    return (
      <Path
        key={roomId}
        data={geojsonToPath(room.polygon)}
        stroke="black"
        strokeWidth={nodeSize / 2}
        closed
        fill={fillColors[colorIndex]}
        onClick={() => router.push(`?roomId=${roomId}`)}
      />
    );
  });
};

export default PolygonsDisplay;
