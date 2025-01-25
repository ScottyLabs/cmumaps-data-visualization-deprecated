import Link from "next/link";

import React from "react";

import { savingHelper } from "../../../lib/apiRoutes";
import { setNodes } from "../../../lib/features/dataSlice";
import { useDeleteEdgeAcrossFloorsMutation } from "../../../lib/features/graphApiSlice";
import { getNodeIdSelected } from "../../../lib/features/mouseEventSlice";
import { useAppDispatch, useAppSelector } from "../../../lib/hooks";
import {
  NodeInfo,
  EdgeInfo,
  EdgeTypeList,
  Nodes,
  ID,
} from "../../shared/types";
import { renderCell } from "../../utils/displayUtils";
import EditTypeCell from "../EditTypeCell";

interface Props {
  floorCode: string;
  nodes: Nodes;
  neighbors: Record<string, EdgeInfo>;
  differentFloorNeighbors: Record<string, EdgeInfo>;
}

const DifferentFloorNeighborTable = ({
  floorCode,
  nodes,
  neighbors,
  differentFloorNeighbors,
}: Props) => {
  const dispatch = useAppDispatch();

  const nodeId = useAppSelector((state) => getNodeIdSelected(state.mouseEvent));
  const [deleteEdge] = useDeleteEdgeAcrossFloorsMutation();

  if (!nodeId) {
    return;
  }

  const renderDifferentFloorNeighbors = (
    differentFloorNeighbors: Record<string, EdgeInfo>
  ) => {
    const calculatePath = (neighborId) => {
      const toFloorInfo = neighbors[neighborId].toFloorInfo;

      // this should never happen
      if (!toFloorInfo) {
        return floorCode;
      }

      return `${toFloorInfo.toFloor}?nodeId=${neighborId}`;
    };

    const handleSaveTypeAcrossFloors =
      (neighborId) => (setSelectedOption) => async (newValue) => {
        setSelectedOption(newValue);

        const newNodes: Record<string, NodeInfo> = JSON.parse(
          JSON.stringify(nodes)
        );

        const newToFloorInfo =
          newNodes[nodeId].neighbors[neighborId].toFloorInfo;

        // guaranteed to be defined because this method will only be
        // called on edges that have toFloorInfo
        if (!newToFloorInfo) {
          return;
        }

        newToFloorInfo.type = newValue.value;

        dispatch(setNodes(newNodes));

        // update this floor's graph json
        savingHelper(
          "/api/updateGraph",
          JSON.stringify({
            floorCode: floorCode,
            newGraph: JSON.stringify(newNodes),
          })
        );

        // update neighbor floor's graph json
        const neighborFloorInfo = JSON.parse(JSON.stringify(newToFloorInfo));
        neighborFloorInfo.toFloor = floorCode;

        savingHelper(
          "/api/updateEdgeAcrossFloors",
          JSON.stringify({
            floorCode: newToFloorInfo.toFloor,
            nodeId: neighborId,
            neighborId: nodeId,
            newToFloorInfo: neighborFloorInfo,
          })
        );
      };

    const deleteEdgeAcrossFloors = (neighborId: ID) => {
      const outFloorCode = neighbors[neighborId].toFloorInfo?.toFloor;

      // this should never happen
      if (!outFloorCode) {
        return;
      }

      deleteEdge({
        inFloorCode: floorCode,
        inNodeId: nodeId,
        outFloorCode,
        outNodeId: neighborId,
      });
    };

    return Object.entries(differentFloorNeighbors).map(
      ([neighborId, neighbor]) => (
        <tr key={neighborId}>
          <td className="border p-2">
            <Link
              className="whitespace-nowrap border px-1 text-sm hover:bg-sky-700"
              href={calculatePath(neighborId)}
            >
              {neighbor.toFloorInfo?.toFloor}
            </Link>
          </td>
          <EditTypeCell
            value={neighbor.toFloorInfo?.type}
            typeList={EdgeTypeList}
            handleChange={handleSaveTypeAcrossFloors(neighborId)}
          />
          <td className="border p-2">
            <button
              className="whitespace-nowrap border px-1 text-sm hover:bg-sky-700"
              onClick={() => deleteEdgeAcrossFloors(neighborId)}
            >
              delete
            </button>
          </td>
        </tr>
      )
    );
  };

  return (
    <div>
      <h1 className="mb-1">Different Floor Neighbors</h1>
      <table className="table-auto text-center">
        <tbody>
          <tr>
            {renderCell("floor")}
            {renderCell("type")}
            {renderCell("delete")}
          </tr>
          {renderDifferentFloorNeighbors(differentFloorNeighbors)}
        </tbody>
      </table>
    </div>
  );
};

export default DifferentFloorNeighborTable;
