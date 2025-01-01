import React, { useContext } from "react";
import { NodeSizeContext } from "../contexts/NodeSizeProvider";

interface Props {
  text: string;
}

const NodeSizeSlider = ({ text }: Props) => {
  const { nodeSize, setNodeSize } = useContext(NodeSizeContext);

  return (
    <div className="w-48">
      <input
        type="range"
        min="0.5"
        max="10"
        step=".1"
        value={nodeSize}
        onChange={(e) => setNodeSize(parseFloat(e.target.value))}
        className="h-2 w-full cursor-pointer rounded-lg bg-blue-400"
      />
      <div className="text-center text-sm">
        {text} Size: {nodeSize}
      </div>
    </div>
  );
};

export default NodeSizeSlider;
