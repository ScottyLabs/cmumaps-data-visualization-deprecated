import { useRouter } from "next/navigation";

import React from "react";
import { BiHide } from "react-icons/bi";
import { toast } from "react-toastify";

import {
  AS_EDGE,
  AS_NODE,
} from "../../app/api/addDoorToGraph/addDoorToGraphTypes";
import { savingHelper } from "../../lib/apiRoutes";
import { relinkDoorsAndRooms } from "../../lib/apiRoutes";
import {
  useGetNodesQuery,
  useGetRoomsQuery,
} from "../../lib/features/api/apiSlice";
import { setMst, setNodes } from "../../lib/features/dataSlice";
import { ADD_DOOR_NODE, ADD_NODE, setMode } from "../../lib/features/modeSlice";
import { setDoors } from "../../lib/features/outlineSlice";
import {
  failedLoading,
  finishLoading,
  startLoading,
} from "../../lib/features/statusSlice";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import QuestionCircle from "../shared/QuestionCircle";
import { calcMst, removeOverlappingsNodes } from "../utils/graphUtils";
import { addDoorsToGraph } from "../utils/utils";
import SidePanelButton from "./SidePanelButton";
import NodeSizeSlider from "./SizeSlider";

interface Props {
  floorCode: string;
}

const GraphTab = ({ floorCode }: Props) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data: rooms } = useGetRoomsQuery(floorCode);
  const { data: nodes } = useGetNodesQuery(floorCode);

  const nodeSize = useAppSelector((state) => state.ui.nodeSize);
  const doors = useAppSelector((state) => state.outline.doors);

  if (!doors || !nodes || !rooms) {
    return;
  }

  const handleRemoveOverlappingsNodes = () => {
    const newNodes = removeOverlappingsNodes(nodes, nodeSize);
    dispatch(setNodes(newNodes));
    savingHelper(
      "/api/updateGraph",
      JSON.stringify({
        floorCode: floorCode,
        newGraph: JSON.stringify(newNodes),
      })
    );
  };

  const handleRelinkDoorsAndRooms = async () => {
    router.push("?");
    dispatch(startLoading("Relinking rooms and doors"));
    relinkDoorsAndRooms(floorCode).then((body) => {
      if (!body) {
        const errMessage =
          "Failed to relink rooms and doors! Check the Console for detailed error.";
        dispatch(failedLoading(errMessage));
      } else {
        dispatch(setDoors(body));
        dispatch(finishLoading());
        toast.success("Finished relinking!");
      }
    });
  };

  // used for addDoorToGraph api
  const doorInfos = Object.values(doors).filter(
    (door) => door.roomIds.length == 2
  );

  const renderAddNodeButtonsRow = () => (
    <div className="flex gap-2">
      <SidePanelButton
        text="Add Node"
        handleClick={() => dispatch(setMode(ADD_NODE))}
      />
      <SidePanelButton
        text="Add Door Node"
        handleClick={() => dispatch(setMode(ADD_DOOR_NODE))}
      />
    </div>
  );

  const renderDoorAsGraphRow = () => (
    <div className="flex">
      <p className="py-1">Doors are</p>
      <SidePanelButton
        text="Nodes"
        handleClick={() =>
          addDoorsToGraph(floorCode, doorInfos, AS_NODE, dispatch)
        }
        style="ml-2 px-2 py-1 border"
      />
      <SidePanelButton
        text="Edges"
        handleClick={() =>
          addDoorsToGraph(floorCode, doorInfos, AS_EDGE, setNodes)
        }
        style="ml-2 px-2 py-1 border"
      />
    </div>
  );

  const renderMstRow = () => (
    <div className="flex items-center gap-5">
      <div className="flex items-center gap-2">
        <SidePanelButton
          text="Calculate MST"
          handleClick={() => calcMst(nodes, rooms, router, dispatch)}
        />
        <BiHide
          size={25}
          className="cursor-pointer text-gray-600 hover:text-gray-800"
          onClick={() => dispatch(setMst(null))}
        />
      </div>
      <QuestionCircle
        url="https://en.wikipedia.org/wiki/Minimum_spanning_tree"
        style="text-blue-900"
      />
    </div>
  );

  return (
    <div className="ml-2 mr-2 space-y-4">
      {renderAddNodeButtonsRow()}
      {renderDoorAsGraphRow()}
      {renderMstRow()}
      <SidePanelButton
        text="Relink Rooms and Doors"
        handleClick={handleRelinkDoorsAndRooms}
        style="block"
      />
      <SidePanelButton
        text="Remove Overlapping Nodes"
        handleClick={handleRemoveOverlappingsNodes}
        style="block"
      />
      <NodeSizeSlider text="Node" />
    </div>
  );
};

export default GraphTab;
