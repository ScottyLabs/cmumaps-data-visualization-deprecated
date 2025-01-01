import { useSession } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import React, { useCallback, useContext, useEffect, useState } from "react";

import { DEFAULT_DENSITY } from "../../../app/api/detectWalkway/detectWalkway";
import { AWS_API_INVOKE_URL } from "../../../lib/apiRoutes";
import {
  GRAPH_SELECT,
  POLYGON_ADD_VERTEX,
  POLYGON_SELECT,
  setMode,
} from "../../../lib/features/modeSlice";
import { useAppDispatch } from "../../../lib/hooks";
import ToggleSwitch from "../../common/ToggleSwitch";
import { DisplaySettingsContext } from "../../contexts/DisplaySettingsProvider";
import { GraphContext } from "../../contexts/GraphProvider";
import { IdEventsContext } from "../../contexts/IdEventsProvider";
import { LoadingContext } from "../../contexts/LoadingProvider";
import { PolygonContext } from "../../contexts/PolygonProvider";
import { RoomsContext } from "../../contexts/RoomsProvider";
import { ShortcutsStatusContext } from "../../contexts/ShortcutsStatusProvider";
import { WalkwayTypeList } from "../../shared/types";
import { getRoomId } from "../../utils/utils";

interface Props {
  floorCode: string;
}

const RoomInfoTable = ({ floorCode }: Props) => {
  const router = useRouter();
  const { session } = useSession();
  const dispatch = useAppDispatch();

  const { setLoadingText } = useContext(LoadingContext);

  const { showRoomSpecific, setShowRoomSpecific, editRoomLabel } = useContext(
    DisplaySettingsContext
  );

  const { shortcutsDisabled } = useContext(ShortcutsStatusContext);

  const { editPolygon, setEditPolygon, setEditRoomLabel } = useContext(
    DisplaySettingsContext
  );

  const { rooms } = useContext(RoomsContext);
  const { nodes, setNodes } = useContext(GraphContext);
  const { idSelected } = useContext(IdEventsContext);

  const roomId = getRoomId(nodes, idSelected);
  const room = rooms[roomId];

  const { setHistory, setCoordsIndex } = useContext(PolygonContext);

  const handleEditPolygonModeClick = useCallback(() => {
    const curPolygon = rooms[roomId].polygon;

    if (editPolygon) {
      setEditPolygon(false);
      dispatch(setMode(GRAPH_SELECT));
    } else {
      setEditPolygon(true);
      dispatch(setMode(POLYGON_SELECT));
      setHistory([curPolygon]);
      setCoordsIndex(0);
    }
  }, [
    dispatch,
    editPolygon,
    roomId,
    rooms,
    setCoordsIndex,
    setEditPolygon,
    setHistory,
  ]);

  useEffect(() => {
    if (shortcutsDisabled) {
      return;
    }

    // enter edit polygon mode when pressing v
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "v") {
        if (!editPolygon) {
          handleEditPolygonModeClick();
          dispatch(setMode(POLYGON_ADD_VERTEX));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dispatch, editPolygon, handleEditPolygonModeClick, shortcutsDisabled]);

  const renderSetEditPolygonButton = () => {
    return (
      <td className="text-center">
        <button
          className="my-2 w-28 rounded bg-slate-500 px-4 py-1 text-sm text-white hover:bg-slate-700"
          onClick={handleEditPolygonModeClick}
        >
          {editPolygon ? "Finish Editing" : "Edit Room Polygon"}
        </button>
      </td>
    );
  };

  const renderSetEditLabelButton = () => {
    return (
      <td className="text-center">
        <button
          className="my-2 w-28 rounded bg-slate-500 px-4 py-1 text-sm text-white hover:bg-slate-700"
          onClick={() => setEditRoomLabel(!editRoomLabel)}
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
              handleToggle={() => setShowRoomSpecific(!showRoomSpecific)}
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

      router.push(floorCode);

      setLoadingText("Detect Walkway");

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
      setNodes(walkwayBody.nodes);
      setLoadingText("");
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
        {renderSetEditPolygonButton()}
        {renderSetEditLabelButton()}
      </tr>
      {renderRoomSpecificToggle()}
      {RenderDetectWalkwayRow()}
    </>
  );
};

export default RoomInfoTable;
