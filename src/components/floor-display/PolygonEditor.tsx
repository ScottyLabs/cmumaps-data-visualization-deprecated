import { Polygon } from "geojson";

import React, { useCallback, useContext, useEffect, useState } from "react";
import { Circle, Line } from "react-konva";
import { toast } from "react-toastify";

import {
  POLYGON_ADD_VERTEX,
  POLYGON_DELETE_VERTEX,
  POLYGON_SELECT,
  setMode,
} from "../../lib/features/modeSlice";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import { PolygonContext } from "../contexts/PolygonProvider";
import { RoomsContext } from "../contexts/RoomsProvider";
import { ShortcutsStatusContext } from "../contexts/ShortcutsStatusProvider";
import { ID } from "../shared/types";
import { saveToPolygonHistory, saveToRooms } from "../utils/polygonUtils";
import { setCursor } from "../utils/utils";

interface Props {
  floorCode: string;
  roomId: ID;
  polygon: Polygon;
  nodeSize: number;
}

const PolygonEditor = ({ floorCode, roomId, polygon, nodeSize }: Props) => {
  const dispatch = useAppDispatch();

  const mode = useAppSelector((state) => state.mode.mode);

  const { shortcutsDisabled } = useContext(ShortcutsStatusContext);
  const { rooms, setRooms } = useContext(RoomsContext);
  const { history, setHistory, historyIndex, setHistoryIndex, coordsIndex } =
    useContext(PolygonContext);

  const [vertexOnDrag, setVertexOnDrag] = useState<number>(-1);

  const saveNewPolygonEdit = (newPolygon: Polygon) => {
    saveToPolygonHistory(
      history,
      setHistory,
      historyIndex,
      setHistoryIndex,
      newPolygon
    );
    saveToRoomsHelper(newPolygon);
  };

  const saveToRoomsHelper = useCallback(
    (newPolygon: Polygon) => {
      saveToRooms(floorCode, roomId, rooms, setRooms, newPolygon, dispatch);
    },
    [dispatch, floorCode, roomId, rooms, setRooms]
  );

  useEffect(() => {
    if (shortcutsDisabled) {
      return;
    }

    const undo = () => {
      if (historyIndex == 0) {
        toast.error("Can't undo anymore!");
        return;
      }

      saveToRoomsHelper(history[historyIndex - 1]);
      setHistoryIndex(historyIndex - 1);
    };

    const redo = () => {
      if (historyIndex == history.length - 1) {
        toast.error("Can't redo anymore!");
        return;
      }

      saveToRoomsHelper(history[historyIndex + 1]);
      setHistoryIndex(historyIndex + 1);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "z") {
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (event.key === "d") {
        dispatch(setMode(POLYGON_DELETE_VERTEX));
      } else if (event.key === "v") {
        dispatch(setMode(POLYGON_ADD_VERTEX));
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    dispatch,
    history,
    historyIndex,
    saveToRoomsHelper,
    setHistoryIndex,
    shortcutsDisabled,
  ]);

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

    saveNewPolygonEdit(newPolygon);
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

      saveNewPolygonEdit(newPolygon);
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
          index == 0 ||
          index == vertexOnDrag ||
          (index + coords.length - 1) % coords.length == vertexOnDrag ||
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
              onDragStart={() => setVertexOnDrag(index)}
              onDragEnd={(e) => {
                handleOnDragEnd(e, index);
                setVertexOnDrag(-1);
              }}
              onClick={() => handleClick(index)}
            />
          )
      )}
    </>
  );
};

export default PolygonEditor;
