import React from "react";

import {
  useGetNodesQuery,
  useGetRoomsQuery,
} from "../../lib/features/apiSlice";
import { GRAPH_SELECT, setMode } from "../../lib/features/modeSlice";
import {
  setEditRoomLabel,
  setInfoDisplayActiveTabIndex,
} from "../../lib/features/uiSlice";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import GraphInfoDisplay from "./node-info/GraphInfoDisplay";
import RoomInfoDisplay from "./room-info/RoomInfoDisplay";

interface Props {
  floorCode: string;
}

const InfoDisplay = ({ floorCode }: Props) => {
  const dispatch = useAppDispatch();
  const { data: nodes } = useGetNodesQuery(floorCode);
  const { data: rooms } = useGetRoomsQuery(floorCode);

  const activeTabIndex = useAppSelector(
    (state) => state.ui.infoDisplayActiveTabIndex
  );

  const renderRoomInfoDisplay = () => {
    if (nodes && rooms) {
      return (
        <RoomInfoDisplay floorCode={floorCode} rooms={rooms} nodes={nodes} />
      );
    }
  };

  const renderGraphInfoDisplay = () => (
    <GraphInfoDisplay floorCode={floorCode} />
  );

  const tabNames = ["Room Info", "Graph Info"];
  const tabContents = [renderRoomInfoDisplay, renderGraphInfoDisplay];

  const renderTabHeader = (tabName, index) => {
    const handleClick = () => {
      dispatch(setEditRoomLabel(false));
      dispatch(setInfoDisplayActiveTabIndex(index));
      dispatch(setMode(GRAPH_SELECT));
    };

    return (
      <button
        key={index}
        className={`mb-3 cursor-pointer border-b-2 px-3 pb-2 pt-4 text-center font-medium ${
          index === activeTabIndex
            ? "border-blue-400 text-blue-400"
            : "border-transparent text-gray-400 hover:border-gray-300 hover:text-white"
        }`}
        onClick={handleClick}
      >
        {tabName}
      </button>
    );
  };

  return (
    <div className="w-fit rounded-lg bg-gray-600 px-2 pb-2 text-white shadow-lg">
      <ul className="flex text-sm">
        {tabNames.map((tabName, index) => renderTabHeader(tabName, index))}
      </ul>
      {tabContents[activeTabIndex]()}
    </div>
  );
};

export default InfoDisplay;
