import { useRouter } from "next/navigation";

import React, { useContext } from "react";
import { BiHide } from "react-icons/bi";

import {
  AsEdge,
  AsNode,
} from "../../app/api/addDoorToGraph/addDoorToGraphTypes";
import { setMst } from "../../lib/features/dataSlice";
import { ADD_DOOR_NODE, ADD_NODE, setMode } from "../../lib/features/modeSlice";
import { setDoors } from "../../lib/features/outlineSlice";
import {
  failedLoading,
  finishLoading,
  startLoading,
} from "../../lib/features/statusSlice";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import { GraphContext } from "../contexts/GraphProvider";
import { RoomsContext } from "../contexts/RoomsProvider";
import QuestionCircle from "../shared/QuestionCircle";
import { calcMst, removeOverlappingsNodes } from "../utils/graphUtils";
import { addDoorsToGraph, savingHelper } from "../utils/utils";
import SidePanelButton from "./SidePanelButton";
import NodeSizeSlider from "./SizeSlider";

interface Props {
  floorCode: string;
}

const GraphTab = ({ floorCode }: Props) => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const nodeSize = useAppSelector((state) => state.nodeSize.nodeSize);
  const doors = useAppSelector((state) => state.outline.doors);

  const { nodes, setNodes } = useContext(GraphContext);
  const { rooms } = useContext(RoomsContext);

  const handleRemoveOverlappingsNodes = () => {
    const newNodes = removeOverlappingsNodes(nodes, nodeSize);
    setNodes(newNodes);
    savingHelper(
      "/api/updateGraph",
      JSON.stringify({
        floorCode: floorCode,
        newGraph: JSON.stringify(newNodes),
      }),
      dispatch
    );
  };

  const relinkDoorsAndRooms = async () => {
    router.push("?");

    dispatch(startLoading("Relinking rooms and doors"));

    const result = await fetch("/api/relinkRoomsAndDoors", {
      method: "POST",
      body: JSON.stringify({
        floorCode: floorCode,
      }),
    });

    const body = await result.json();

    if (!result.ok) {
      console.error(body.error);
      dispatch(
        failedLoading(
          "Failed to relink rooms and doors! Check the Console for detailed error."
        )
      );
      return;
    }

    dispatch(setDoors(body));
    dispatch(finishLoading());
  };

  if (!doors) {
    return;
  }

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
          addDoorsToGraph(floorCode, doorInfos, AsNode, setNodes)
        }
        style="ml-2 px-2 py-1 border"
      />
      <SidePanelButton
        text="Edges"
        handleClick={() =>
          addDoorsToGraph(floorCode, doorInfos, AsEdge, setNodes)
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
        handleClick={relinkDoorsAndRooms}
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
