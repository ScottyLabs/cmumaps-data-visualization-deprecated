import { useSession } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import React, { useState } from "react";

import { DEFAULT_DENSITY } from "../../../app/api/detectWalkway/detectWalkway";
import { AWS_API_INVOKE_URL } from "../../../lib/apiRoutes";
import { useGetRoomsQuery } from "../../../lib/features/api/apiSlice";
import { setNodes } from "../../../lib/features/dataSlice";
import {
  selectEditPolygon,
  toggleEditPolygon,
} from "../../../lib/features/modeSlice";
import { getNodeIdSelected } from "../../../lib/features/mouseEventSlice";
import { finishLoading, startLoading } from "../../../lib/features/statusSlice";
import {
  toggleEditRoomLabel,
  toggleShowRoomSpecific,
} from "../../../lib/features/uiSlice";
import { useAppDispatch, useAppSelector } from "../../../lib/hooks";
import ToggleSwitch from "../../common/ToggleSwitch";
import { Nodes, WalkwayTypeList } from "../../shared/types";
import { getRoomId } from "../../utils/utils";

interface Props {
  floorCode: string;
  nodes: Nodes;
}

const RoomInfoTable = ({ floorCode, nodes }: Props) => {
  const router = useRouter();
  const { session } = useSession();
  const dispatch = useAppDispatch();

  const { data: rooms } = useGetRoomsQuery(floorCode);

  const showRoomSpecific = useAppSelector((state) => state.ui.showRoomSpecific);
  const editPolygon = useAppSelector(selectEditPolygon);
  const editRoomLabel = useAppSelector((state) => state.ui.editRoomLabel);
  const nodeId = useAppSelector((state) => getNodeIdSelected(state.mouseEvent));

  if (!rooms) {
    return;
  }

  const roomId = getRoomId(nodes, nodeId);
  const room = rooms[roomId];

  const renderToggleEditPolygonButton = () => {
    return (
      <td className="text-center">
        <button
          className="my-2 w-28 rounded bg-slate-500 px-4 py-1 text-sm text-white hover:bg-slate-700"
          onClick={() => dispatch(toggleEditPolygon())}
        >
          {editPolygon ? "Finish Editing" : "Edit Room Polygon"}
        </button>
      </td>
    );
  };

  const renderToggleEditLabelButton = () => {
    return (
      <td className="text-center">
        <button
          className="my-2 w-28 rounded bg-slate-500 px-4 py-1 text-sm text-white hover:bg-slate-700"
          onClick={() => dispatch(toggleEditRoomLabel())}
        >
          {editRoomLabel ? "Finish Editing" : "Edit Room Label"}
        </button>
      </td>
    );
  };

  const renderRoomSpecificToggle = () => {
    return (
      <tr>
        <td colSpan={2}>
          <div className="flex items-center justify-center py-2 text-right">
            <ToggleSwitch
              isOn={showRoomSpecific}
              handleToggle={() => dispatch(toggleShowRoomSpecific())}
            />
            <p className="ml-2 text-sm">Show Room Specific Graph</p>
          </div>
        </td>
      </tr>
    );
  };

  const RenderDetectWalkwayRow = () => {
    const [density, setDensity] = useState<number>(DEFAULT_DENSITY);

    if (editPolygon) {
      return;
    }

    const detectWalkway = async () => {
      const token = await session?.getToken();

      router.push("?");

      dispatch(startLoading("Detect Walkway"));

      const room = rooms[roomId];
      const walkwayResult = await fetch(
        `${AWS_API_INVOKE_URL}/detect-walkway`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          method: "POST",
          body: JSON.stringify({ roomId, room, density }),
        }
      );

      const walkwayBody = await walkwayResult.json();

      if (!walkwayResult.ok) {
        console.error(walkwayBody.error);
        return;
      }

      // setNodes({ ...nodes, ...walkwayBody.nodes });
      dispatch(setNodes(walkwayBody.nodes));
      dispatch(finishLoading());
    };

    if (WalkwayTypeList.includes(room.type)) {
      return (
        <tr>
          <td className="text-center">
            <button
              className="my-2 w-28 rounded bg-slate-500 px-4 py-1 text-sm text-white hover:bg-slate-700"
              onClick={detectWalkway}
            >
              Detect Walkway
            </button>
          </td>
          <td>
            <div className="flex justify-center">
              <div className="w-24">
                <input
                  type="range"
                  min="0.25"
                  max="2"
                  step=".25"
                  value={density}
                  onChange={(e) => setDensity(parseFloat(e.target.value))}
                  className="h-2 w-full cursor-pointer rounded-lg bg-blue-400"
                />
                <div className="text-center text-sm">Density: {density}</div>
              </div>
            </div>
          </td>
        </tr>
      );
    }
  };

  return (
    <>
      <tr>
        {renderToggleEditPolygonButton()}
        {renderToggleEditLabelButton()}
      </tr>
      {renderRoomSpecificToggle()}
      {RenderDetectWalkwayRow()}
    </>
  );
};

export default RoomInfoTable;
