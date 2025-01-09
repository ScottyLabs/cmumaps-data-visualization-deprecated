import { useSession } from "@clerk/nextjs";
import { Polygon } from "geojson";

import React, { useContext } from "react";

import useSavePolygonEdit from "../../hooks/useSavePolygonEdit";
import { AWS_API_INVOKE_URL } from "../../lib/apiRoutes";
import { useGetRoomsQuery } from "../../lib/features/apiSlice";
import {
  POLYGON_ADD_VERTEX,
  POLYGON_DELETE_VERTEX,
  setMode,
} from "../../lib/features/modeSlice";
import { getNodeIdSelected } from "../../lib/features/mouseEventSlice";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import { PolygonContext } from "../contexts/PolygonProvider";
import { RED_BUTTON_STYLE } from "../utils/displayUtils";
import { getRoomId } from "../utils/utils";
import SidePanelButton from "./SidePanelButton";
import NodeSizeSlider from "./SizeSlider";

interface Props {
  floorCode: string;
}

const PolygonTab = ({ floorCode }: Props) => {
  const { session } = useSession();
  const dispatch = useAppDispatch();

  const { data: rooms } = useGetRoomsQuery(floorCode);
  const { coordsIndex, setCoordsIndex } = useContext(PolygonContext);

  const nodes = useAppSelector((state) => state.data.nodes);
  const nodeId = useAppSelector((state) => getNodeIdSelected(state.mouseEvent));
  const roomId = getRoomId(nodes, nodeId);

  const savePolygonEdit = useSavePolygonEdit(floorCode, roomId);

  if (!rooms) {
    return;
  }

  const polygon = rooms[roomId].polygon;

  const renderInteriorButton = () => {
    const addHole = () => {
      const newPolygon: Polygon = JSON.parse(JSON.stringify(polygon));
      newPolygon.coordinates.push([]);
      savePolygonEdit(newPolygon);
    };

    const deleteHole = () => {
      const newPolygon: Polygon = JSON.parse(JSON.stringify(polygon));
      newPolygon.coordinates.splice(coordsIndex, 1);
      setCoordsIndex(coordsIndex - 1);
      savePolygonEdit(newPolygon);
    };

    if (coordsIndex == 0) {
      return (
        <SidePanelButton
          text="Add Hole"
          handleClick={() => addHole()}
          style="px-2 py-1"
        />
      );
    } else {
      return (
        <SidePanelButton
          text="Delete Hole"
          handleClick={() => deleteHole()}
          style="px-2 py-1"
        />
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
    savePolygonEdit(newPolygon);
  };

  const deletePolygon = async () => {
    const newPolygon: Polygon = {
      type: "Polygon",
      coordinates: [[]],
    };
    savePolygonEdit(newPolygon);
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
        <SidePanelButton
          text="Add Vertex"
          handleClick={() => dispatch(setMode(POLYGON_ADD_VERTEX))}
        />
        <SidePanelButton
          text="Delete Vertex"
          handleClick={() => dispatch(setMode(POLYGON_DELETE_VERTEX))}
        />
      </div>

      <SidePanelButton
        text="Simplify Polygon"
        handleClick={() => simplifyPolygon()}
        style="block"
      />

      <NodeSizeSlider text="Vertex" />

      <SidePanelButton
        text="Delete Polygon"
        handleClick={() => deletePolygon()}
        style={RED_BUTTON_STYLE + " block"}
      />
    </div>
  );
};

export default PolygonTab;
