import { useRouter } from "next/navigation";

import React from "react";

import { savingHelper } from "../../../lib/apiRoutes";
import { setNodes } from "../../../lib/features/dataSlice";
import {
  getNodeIdSelected,
  hoverNode,
  unHoverNode,
} from "../../../lib/features/mouseEventSlice";
import { useAppDispatch, useAppSelector } from "../../../lib/hooks";
import { Edge } from "../../shared/types";
import { renderCell } from "../../utils/displayUtils";
import { dist } from "../../utils/utils";

interface Props {
  floorCode: string;
  sameFloorNeighbors: Record<string, Edge>;
}

const SameFloorNeighborTable = ({ floorCode, sameFloorNeighbors }: Props) => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const nodes = useAppSelector((state) => state.data.nodes);
  const nodeId = useAppSelector((state) => getNodeIdSelected(state.mouseEvent));

  if (!nodes) {
    return;
  }

  const deleteEdge = (nodeId, neighborID) => {
    dispatch(unHoverNode());

    const newNodes = { ...nodes };
    const newNode = JSON.parse(JSON.stringify(newNodes[nodeId]));

    delete newNode.neighbors[neighborID];
    newNodes[nodeId] = newNode;

    delete newNodes[neighborID].neighbors[nodeId];

    dispatch(setNodes(newNodes));

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
        onMouseEnter={() => dispatch(hoverNode(neighborID))}
        onMouseLeave={() => dispatch(unHoverNode())}
      >
        {text}
      </button>
    </td>
  );

  const renderSameFloorNeighbors = (
    sameFloorNeighbors: Record<string, Edge>
  ) => {
    return Object.keys(sameFloorNeighbors).map((neighborID) => {
      const selectHandleClick = () => {
        router.push(`?nodeId=${neighborID}`);
      };

      const deleteHandleClick = () => deleteEdge(nodeId, neighborID);

      return (
        <tr key={neighborID}>
          {renderButtonCell("select", neighborID, selectHandleClick)}
          <td className="border p-2">
            {dist(nodes[nodeId].pos, nodes[neighborID].pos).toPrecision(3)}
          </td>
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
