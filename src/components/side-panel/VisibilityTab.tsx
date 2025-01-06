import { useRouter } from "next/navigation";

import React from "react";

import { selectEditPolygon } from "../../lib/features/modeSlice";
import {
  toggleShowEdges,
  toggleShowFile,
  toggleShowLabels,
  toggleShowNodes,
  toggleShowOutline,
  toggleShowPolygons,
} from "../../lib/features/visibilitySlice";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import { SHOW_REGENERATE_BUTTON } from "../../settings";
import ToggleSwitch from "../common/ToggleSwitch";
import { RED_BUTTON_STYLE } from "../utils/displayUtils";
import SidePanelButton from "./SidePanelButton";

interface Props {
  parsePDF: (regnerate: boolean) => void;
}

const VisibilityTab = ({ parsePDF }: Props) => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const editPolygon = useAppSelector(selectEditPolygon);
  const {
    showFile,
    showOutline,
    showNodes,
    showEdges,
    showLabels,
    showPolygons,
  } = useAppSelector((state) => state.visibility);

  const renderToggle = (
    text: string,
    isOn: boolean,
    handleToggle: () => void
  ) => {
    return (
      <div className="flex text-nowrap">
        <p className="mr-3 mt-1">{text}</p>
        <ToggleSwitch isOn={isOn} handleToggle={handleToggle} />
      </div>
    );
  };

  const handleRegenerate = () => {
    if (
      confirm("Are you sure you want to regnerate the graph for this floor?")
    ) {
      router.push("?");
      parsePDF(true);
    }
  };

  return (
    <div className="ml-3 mr-2 mt-1 space-y-5">
      {renderToggle("Show File", showFile, () => dispatch(toggleShowFile()))}
      {renderToggle("Show Outline", showOutline, () =>
        dispatch(toggleShowOutline())
      )}
      {renderToggle("Show Nodes", showNodes, () => dispatch(toggleShowNodes()))}
      {renderToggle("Show Edges", showEdges, () => dispatch(toggleShowEdges()))}
      {renderToggle("Show Labels", showLabels, () =>
        dispatch(toggleShowLabels())
      )}
      {renderToggle("Show Polygons", showPolygons, () =>
        dispatch(toggleShowPolygons())
      )}

      {SHOW_REGENERATE_BUTTON && !editPolygon && (
        <SidePanelButton
          text="Regenerate"
          handleClick={handleRegenerate}
          style={RED_BUTTON_STYLE + " text-base"}
        />
      )}
    </div>
  );
};

export default VisibilityTab;
