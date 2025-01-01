import { useSession } from "@clerk/nextjs";
import { Polygon } from "geojson";

import React, { useContext } from "react";

import { AWS_API_INVOKE_URL } from "../../lib/apiRoutes";
import { GraphContext } from "../contexts/GraphProvider";
import { IdEventsContext } from "../contexts/IdEventsProvider";
import { ModeContext } from "../contexts/ModeProvider";
import { PolygonContext } from "../contexts/PolygonProvider";
import { RoomsContext } from "../contexts/RoomsProvider";
import { SaveStatusContext } from "../contexts/SaveStatusProvider";
import {
  setModePolygonAddVertex,
  setModePolygonDeleteVertex,
} from "../shared/keyboardShortcuts";
import { RED_BUTTON_STYLE, renderSidePanelButton } from "../utils/displayUtils";
import { saveToPolygonHistory, saveToRooms } from "../utils/polygonUtils";
import { getRoomId } from "../utils/utils";
import NodeSizeSlider from "./SizeSlider";

interface Props {
  floorCode: string;
}

const PolygonTab = ({ floorCode }: Props) => {
  const { session } = useSession();

  const { setMode } = useContext(ModeContext);
  const { rooms, setRooms } = useContext(RoomsContext);
  const setSaveStatus = useContext(SaveStatusContext);
  const {
    history,
    setHistory,
    historyIndex,
    setHistoryIndex,
    coordsIndex,
    setCoordsIndex,
  } = useContext(PolygonContext);

  const { nodes } = useContext(GraphContext);
  const { idSelected } = useContext(IdEventsContext);
  const roomIdSelected = getRoomId(nodes, idSelected);

  const roomId = getRoomId(nodes, idSelected);
  const polygon = rooms[roomId].polygon;

  const renderInteriorButton = () => {
    const addHole = () => {
      const newPolygon: Polygon = JSON.parse(JSON.stringify(polygon));
      newPolygon.coordinates.push([]);

      saveToPolygonHistory(
        history,
        setHistory,
        historyIndex,
        setHistoryIndex,
        newPolygon
      );
      saveToRooms(
        floorCode,
        roomIdSelected,
        rooms,
        setRooms,
        newPolygon,
        setSaveStatus
      );
    };

    const deleteHole = () => {
      const newPolygon: Polygon = JSON.parse(JSON.stringify(polygon));
      newPolygon.coordinates.splice(coordsIndex, 1);
      setCoordsIndex(coordsIndex - 1);

      saveToPolygonHistory(
        history,
        setHistory,
        historyIndex,
        setHistoryIndex,
        newPolygon
      );
      saveToRooms(
        floorCode,
        roomIdSelected,
        rooms,
        setRooms,
        newPolygon,
        setSaveStatus
      );
    };

    if (coordsIndex == 0) {
      return renderSidePanelButton(
        "Add Hole",
        () => {
          addHole();
        },
        "px-2 py-1"
      );
    } else {
      return renderSidePanelButton(
        "Delete Hole",
        () => {
          deleteHole();
        },
        "px-2 py-1"
      );
    }
  };

  const simplifyPolygon = async () => {
    const token = await session?.getToken();

    const result = await fetch(`${AWS_API_INVOKE_URL}/simplify-polygon`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      method: "POST",
      body: JSON.stringify({ polygon }),
    });

    const body = await result.json();

    if (!result.ok) {
      console.error(body.error);
      return;
    }

    const newPolygon: Polygon = JSON.parse(body);
    saveToPolygonHistory(
      history,
      setHistory,
      historyIndex,
      setHistoryIndex,
      newPolygon
    );
    saveToRooms(floorCode, roomId, rooms, setRooms, newPolygon, setSaveStatus);
  };

  const deletePolygon = async () => {
    const newPolygon: Polygon = {
      type: "Polygon",
      coordinates: [[]],
    };
    saveToPolygonHistory(
      history,
      setHistory,
      historyIndex,
      setHistoryIndex,
      newPolygon
    );
    saveToRooms(floorCode, roomId, rooms, setRooms, newPolygon, setSaveStatus);
  };

  return (
    <div className="ml-2 mr-2 space-y-4">
      <div className="flex space-x-3">
        <select
          value={coordsIndex}
          onChange={(e) => setCoordsIndex(Number(e.target.value))}
          className="rounded"
        >
          {polygon.coordinates.map((_, index) => (
            <option value={index} key={index}>
              {index == 0 ? "Exterior" : "Hole " + index}
            </option>
          ))}
        </select>

        {renderInteriorButton()}
      </div>

      <div className="space-x-2">
        {renderSidePanelButton("Add Vertex", () =>
          setModePolygonAddVertex(setMode)
        )}
        {renderSidePanelButton("Delete Vertex", () =>
          setModePolygonDeleteVertex(setMode)
        )}
      </div>

      <div>
        {renderSidePanelButton("Simplify Polygon", () => {
          simplifyPolygon();
        })}
      </div>

      <NodeSizeSlider text="Vertex" />

      <div>
        {renderSidePanelButton(
          "Delete Polygon",
          () => {
            deletePolygon();
          },
          RED_BUTTON_STYLE
        )}
      </div>
    </div>
  );
};

export default PolygonTab;
