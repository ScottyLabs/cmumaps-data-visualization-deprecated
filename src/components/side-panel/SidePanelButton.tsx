import { twMerge } from "tailwind-merge";

import React from "react";

interface Props {
  text: string;
  handleClick: () => void;
  style?: string;
}

const SidePanelButton = ({ text, handleClick, style }: Props) => {
  return (
    <button
      className={twMerge(
        "text-nowrap rounded bg-blue-500 px-4 py-2 text-sm font-bold text-emerald-200 hover:bg-blue-700",
        style
      )}
      onClick={handleClick}
    >
      {text}
    </button>
  );
};

export default SidePanelButton;
