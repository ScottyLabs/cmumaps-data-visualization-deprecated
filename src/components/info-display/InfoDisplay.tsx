import React, { useContext, useState } from "react";
import GraphInfoDisplay from "./node-info/GraphInfoDisplay";
import RoomInfoDisplay from "./room-info/RoomInfoDisplay";
import { DisplaySettingsContext } from "../contexts/DisplaySettingsProvider";

interface Props {
  floorCode: string;
}

const InfoDisplay = ({ floorCode }: Props) => {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const { editPolygon, editRoomLabel } = useContext(DisplaySettingsContext);

  const renderRoomInfoDisplay = () => <RoomInfoDisplay floorCode={floorCode} />;

  const renderGraphInfoDisplay = () => (
    <GraphInfoDisplay floorCode={floorCode} />
  );

  const tabNames = ["Room Info", "Graph Info"];
  const tabContents = [renderRoomInfoDisplay, renderGraphInfoDisplay];

  return (
    <div className="w-fit rounded-lg bg-gray-600 px-2 pb-2 text-white shadow-lg">
      <ul className="flex text-sm">
        {tabNames.map((tabName, index) => (
          <button
            key={index}
            className={`mb-3 cursor-pointer border-b-2 px-3 pb-2 pt-4 text-center font-medium ${
              index === activeTabIndex
                ? "border-blue-400 text-blue-400"
                : "border-transparent text-gray-400 hover:border-gray-300 hover:text-white"
            }`}
            onClick={() => {
              if (!editPolygon && !editRoomLabel) {
                setActiveTabIndex(index);
              }
            }}
          >
            {tabName}
          </button>
        ))}
      </ul>
      {tabContents[activeTabIndex]()}
    </div>
  );
};

export default InfoDisplay;
