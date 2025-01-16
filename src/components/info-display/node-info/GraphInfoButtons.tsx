import { useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";

import React from "react";
import { toast } from "react-toastify";

import { useGetNodesQuery } from "../../../lib/features/apiSlice";
import {
  ADD_EDGE,
  DELETE_EDGE,
  setMode,
} from "../../../lib/features/modeSlice";
import { getNodeIdSelected } from "../../../lib/features/mouseEventSlice";
import { useAppDispatch, useAppSelector } from "../../../lib/hooks";
import { deleteNode } from "../../shared/keyboardShortcuts";
import { RED_BUTTON_STYLE } from "../../utils/displayUtils";

interface Props {
  floorCode: string;
}

const GraphInfoButtons = ({ floorCode }: Props) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data: nodes } = useGetNodesQuery(floorCode);

  const nodeId = useAppSelector((state) => getNodeIdSelected(state.mouseEvent));

  if (!nodes || !nodeId) {
    return;
  }

  const renderButton = (text, handleClick, style?) => {
    return (
      <div>
        <button
          className={twMerge(
            "mb-2 rounded bg-slate-500 px-2 py-1 text-sm text-white hover:bg-slate-700",
            style
          )}
          onClick={handleClick}
        >
          {text}
        </button>
      </div>
    );
  };

  const renderCopyNodeIdButton = () => {
    const copyId = () => {
      navigator.clipboard.writeText(nodeId);
      toast.success("Copied!");
    };

    return renderButton("Copy Node ID", copyId);
  };

  const renderDeleteNodeButton = () => {
    const deleteNodeHelper = () =>
      deleteNode(nodes, nodeId, floorCode, router, dispatch);

    return renderButton("Delete Node", deleteNodeHelper, RED_BUTTON_STYLE);
  };

  const renderAddEdgeByClickingButton = () => {
    const addEdge = () => dispatch(setMode(ADD_EDGE));
    return renderButton("Add Edge", addEdge);
  };

  const renderDeleteEdgeButton = () => {
    const deleteEdge = () => dispatch(setMode(DELETE_EDGE));
    return renderButton("Delete Edge", deleteEdge);
  };

  return (
    <div>
      <div className="flex space-x-4">
        {renderCopyNodeIdButton()}
        {renderDeleteNodeButton()}
      </div>
      <div className="flex space-x-4">
        {renderAddEdgeByClickingButton()}
        {renderDeleteEdgeButton()}
      </div>
    </div>
  );
};

export default GraphInfoButtons;
