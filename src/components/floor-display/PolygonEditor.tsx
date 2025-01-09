import { Polygon } from "geojson";

import React, { useContext } from "react";
import { Circle, Line } from "react-konva";

import useSavePolygonEdit from "../../hooks/useSavePolygonEdit";
import {
  POLYGON_DELETE_VERTEX,
  POLYGON_SELECT,
  setMode,
} from "../../lib/features/modeSlice";
import { dragVertex, releaseVertex } from "../../lib/features/polygonSlice";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import { PolygonContext } from "../contexts/PolygonProvider";
import { ID } from "../shared/types";
import { setCursor } from "../utils/canvasUtils";

interface Props {
  floorCode: string;
  roomId: ID;
  polygon: Polygon;
  nodeSize: number;
}

const PolygonEditor = ({ floorCode, roomId, polygon, nodeSize }: Props) => {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.mode.mode);
  const { coordsIndex } = useContext(PolygonContext);
  const savePolygonEdit = useSavePolygonEdit(floorCode, roomId);
  const vertexOnDrag = useAppSelector(
    (state) => state.polygon.vertexIndexOnDrag
  );

  const handleOnDragEnd = (e, index: number) => {
    const newPolygon: Polygon = JSON.parse(JSON.stringify(polygon));
    const coords = newPolygon.coordinates[coordsIndex];
    const newPos = [
      Number(e.target.x().toFixed(2)),
      Number(e.target.y().toFixed(2)),
    ];
    coords[index] = newPos;
    // first and last point need to stay the same
    if (index == 0) {
      coords[coords.length - 1] = newPos;
    }

    savePolygonEdit(newPolygon);
  };

  const handleClick = (index: number) => {
    if (mode == POLYGON_DELETE_VERTEX) {
      const newPolygon: Polygon = JSON.parse(JSON.stringify(polygon));
      const coords = newPolygon.coordinates[coordsIndex];
      coords.splice(index, 1);

      // when deleting the first index
      if (index == 0) {
        // keep the start and end the same if there are more vertices
        if (coords.length != 1) {
          coords.push(coords[0]);
        }
        // delete the duplicate vertex if there is no more vertex
        else {
          coords.pop();
        }
      }

      savePolygonEdit(newPolygon);
      dispatch(setMode(POLYGON_SELECT));
    }
  };

  const renderLines = () => {
    const coords = polygon.coordinates[coordsIndex];
    let prev = coords[0];

    const lines: React.JSX.Element[] = [];

    // skip the first point and point on drag
    coords.map((points, index) => {
      if (
        !(
          index === 0 ||
          index === vertexOnDrag ||
          (index + coords.length - 1) % coords.length === vertexOnDrag ||
          // special case of dragging the last coord
          (vertexOnDrag == 0 && index == coords.length - 1)
        )
      ) {
        lines.push(
          <Line
            key={index}
            points={[...prev, ...points]}
            stroke="orange"
            strokeWidth={nodeSize / 2}
          />
        );
      }
      prev = points;
    });

    return lines.map((line) => line);
  };

  return (
    <>
      {renderLines()}
      {/* first and last point are the same */}
      {polygon.coordinates[coordsIndex].map(
        (point, index) =>
          index !== polygon.coordinates[coordsIndex].length - 1 && (
            <Circle
              key={index}
              x={point[0]}
              y={point[1]}
              radius={nodeSize}
              fill="cyan"
              strokeWidth={nodeSize / 2}
              stroke="black"
              draggable
              onMouseEnter={(e) => setCursor(e, "pointer")}
              onMouseLeave={(e) => setCursor(e, "default")}
              onDragStart={() => dispatch(dragVertex(index))}
              onDragEnd={(e) => {
                handleOnDragEnd(e, index);
                dispatch(releaseVertex());
              }}
              onClick={() => handleClick(index)}
            />
          )
      )}
    </>
  );
};

export default PolygonEditor;
