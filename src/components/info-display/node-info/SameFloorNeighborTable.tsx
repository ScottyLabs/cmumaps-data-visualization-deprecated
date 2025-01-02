import { useRouter } from "next/navigation";

import React, { useContext } from "react";

import {
  getNodeIdSelected,
  setNodeIdHovered,
  unHoverNode,
} from "../../../lib/features/mouseEventSlice";
import { useAppDispatch, useAppSelector } from "../../../lib/hooks";
import { GraphContext } from "../../contexts/GraphProvider";
import { Edge } from "../../shared/types";
import { renderCell } from "../../utils/displayUtils";
import { savingHelper } from "../../utils/utils";

interface Props {
  floorCode: string;
  sameFloorNeighbors: Record<string, Edge>;
}

const SameFloorNeighborTable = ({ floorCode, sameFloorNeighbors }: Props) => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { nodes, setNodes } = useContext(GraphContext);

  const nodeId = useAppSelector((state) => getNodeIdSelected(state.mouseEvent));

  const deleteEdge = (nodeId, neighborID) => {
    dispatch(unHoverNode());

    const newNodes = { ...nodes };
    const newNode = JSON.parse(JSON.stringify(newNodes[nodeId]));

    delete newNode.neighbors[neighborID];
    newNodes[nodeId] = newNode;

    delete newNodes[neighborID].neighbors[nodeId];

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

  const renderButtonCell = (text: string, neighborID, handleClick) => (
    <td className="border p-2">
      <button
        className="whitespace-nowrap border px-1 text-sm hover:bg-sky-700"
        onClick={handleClick}
        onMouseEnter={() => dispatch(setNodeIdHovered(neighborID))}
        onMouseLeave={() => dispatch(unHoverNode())}
      >
        {text}
      </button>
    </td>
  );

  const renderSameFloorNeighbors = (
    sameFloorNeighbors: Record<string, Edge>
  ) => {
    return Object.entries(sameFloorNeighbors).map(([neighborID, neighbor]) => {
      const selectHandleClick = () => {
        router.push(`${floorCode}?nodeId=${neighborID}`);
      };

      const deleteHandleClick = () => deleteEdge(nodeId, neighborID);

      return (
        <tr key={neighborID}>
          {renderButtonCell("select", neighborID, selectHandleClick)}
          <td className="border p-2"> {neighbor.dist.toPrecision(3)}</td>
          {renderButtonCell("delete", neighborID, deleteHandleClick)}
        </tr>
      );
    });
  };

  return (
    <div>
      <h1 className="mb-1">Same Floor Neighbors</h1>
      <table className="table-auto text-center">
        <tbody>
          <tr>
            {renderCell("select")}
            {renderCell("dist")}
            {renderCell("delete")}
          </tr>
          {renderSameFloorNeighbors(sameFloorNeighbors)}
        </tbody>
      </table>
    </div>
  );
};

export default SameFloorNeighborTable;
