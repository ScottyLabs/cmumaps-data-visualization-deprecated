import { useRouter } from "next/navigation";

import React from "react";

import { useDeleteEdgeMutation } from "../../../lib/features/api/graphApiSlice";
import {
  getNodeIdSelected,
  hoverNode,
  unHoverNode,
} from "../../../lib/features/mouseEventSlice";
import { useAppDispatch, useAppSelector } from "../../../lib/hooks";
import { EdgeInfo, ID, Nodes } from "../../shared/types";
import { renderCell } from "../../utils/displayUtils";
import { dist } from "../../utils/utils";

interface Props {
  floorCode: string;
  nodes: Nodes;
  sameFloorNeighbors: Record<string, EdgeInfo>;
}

const SameFloorNeighborTable = ({
  floorCode,
  nodes,
  sameFloorNeighbors,
}: Props) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const nodeId = useAppSelector((state) => getNodeIdSelected(state.mouseEvent));

  const [deleteEdge] = useDeleteEdgeMutation();

  if (!nodeId) {
    return;
  }

  const handleDeleteEdge = (nodeId: ID, neighborId: ID) => () => {
    dispatch(unHoverNode());
    deleteEdge({ floorCode, inNodeId: nodeId, outNodeId: neighborId });
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
    sameFloorNeighbors: Record<string, EdgeInfo>
  ) => {
    return Object.keys(sameFloorNeighbors).map((neighborID) => {
      const selectHandleClick = () => {
        router.push(`?nodeId=${neighborID}`);
      };
      return (
        <tr key={neighborID}>
          {renderButtonCell("select", neighborID, selectHandleClick)}
          <td className="border p-2">
            {dist(nodes[nodeId].pos, nodes[neighborID].pos).toPrecision(3)}
          </td>
          {renderButtonCell(
            "delete",
            neighborID,
            handleDeleteEdge(nodeId, neighborID)
          )}
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
