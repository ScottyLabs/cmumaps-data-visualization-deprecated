import React from "react";

import { GRAPH_SELECT, setMode } from "../../lib/features/modeSlice";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";

const ModeDisplay = () => {
  const dispatch = useAppDispatch();

  const mode = useAppSelector((state) => state.mode.mode);

  const renderResetModeButtton = () => {
    return (
      <button
        className="fixed bottom-10 m-1 rounded border border-black p-1 hover:bg-gray-200"
        onClick={() => dispatch(setMode(GRAPH_SELECT))}
      >
        Reset Mode
      </button>
    );
  };

  return (
    <>
      {renderResetModeButtton()}
      <div className="fixed bottom-0 m-2">Mode: {mode}</div>
    </>
  );
};

export default ModeDisplay;
