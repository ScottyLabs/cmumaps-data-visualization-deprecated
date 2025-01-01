import Link from "next/link";
import { useRouter } from "next/navigation";

import React, { useContext, useMemo } from "react";

import {
  setNodeIdHovered,
  unHoverNode,
} from "../../../lib/features/mouseEventSlice";
import { useAppDispatch, useAppSelector } from "../../../lib/hooks";
import { GraphContext } from "../../contexts/GraphProvider";
import { SaveStatusContext } from "../../contexts/SaveStatusProvider";
import { Node, Edge, EdgeTypeList } from "../../shared/types";
import { renderCell } from "../../utils/displayUtils";
import { getNodeIdSelected, savingHelper } from "../../utils/utils";
import EditTypeRow from "../SelectTypeCell";
import AddEdgeAcrossFloorsSection from "./AddEdgeAcrossFloorsSection";
import GraphInfoButtons from "./GraphInfoButtons";

interface Props {
  floorCode: string;
}

const GraphInfoDisplay = ({ floorCode }: Props) => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const setSaveStatus = useContext(SaveStatusContext);

  const idSelected = useAppSelector((state) => state.mouseEvent.idSelected);

  const { nodes, setNodes } = useContext(GraphContext);

  const nodeId = getNodeIdSelected(idSelected);
  const neighbors = nodes[nodeId].neighbors;

  const { sameFloorNeighbors, differentFloorNeighbors } = useMemo(() => {
    const sameFloor = {};
    const differentFloor = {};

    for (const neighborId in neighbors) {
      if (neighbors[neighborId].toFloorInfo) {
        differentFloor[neighborId] = neighbors[neighborId];
      } else {
        sameFloor[neighborId] = neighbors[neighborId];
      }
    }

    return {
      sameFloorNeighbors: sameFloor,
      differentFloorNeighbors: differentFloor,
    };
  }, [neighbors]);

  const renderSameFloorNeighbors = (
    sameFloorNeighbors: Record<string, Edge>
  ) => {
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
        setSaveStatus
      );
    };

    return Object.entries(sameFloorNeighbors).map(([neighborID, neighbor]) => (
      <tr key={neighborID}>
        <td className="border p-2">
          <button
            className="whitespace-nowrap border px-1 text-sm hover:bg-sky-700"
            onClick={() => {
              router.push(`${floorCode}?nodeId=${neighborID}`);
            }}
            onMouseEnter={() => dispatch(setNodeIdHovered(neighborID))}
            onMouseLeave={() => dispatch(unHoverNode())}
          >
            select
          </button>
        </td>
        <td className="border p-2"> {neighbor.dist.toPrecision(3)}</td>
        <td className="border p-2">
          <button
            className="whitespace-nowrap border px-1 text-sm hover:bg-sky-700"
            onClick={() => deleteEdge(nodeId, neighborID)}
            onMouseEnter={() => dispatch(setNodeIdHovered(neighborID))}
            onMouseLeave={() => dispatch(unHoverNode())}
          >
            delete
          </button>
        </td>
      </tr>
    ));
  };

  const renderDifferentFloorNeighbors = (
    differentFloorNeighbors: Record<string, Edge>
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

        const newNodes: Record<string, Node> = JSON.parse(
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

        setNodes(newNodes);

        // update this floor's graph json
        savingHelper(
          "/api/updateGraph",
          JSON.stringify({
            floorCode: floorCode,
            newGraph: JSON.stringify(newNodes),
          }),
          setSaveStatus
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
          }),
          setSaveStatus
        );
      };

    const deleteEdgeAcrossFloors = (neighborId) => {
      const newNodes: Record<string, Node> = JSON.parse(JSON.stringify(nodes));

      delete newNodes[nodeId].neighbors[neighborId];

      setNodes(newNodes);

      // update this floor's graph json
      savingHelper(
        "/api/updateGraph",
        JSON.stringify({
          floorCode: floorCode,
          newGraph: JSON.stringify(newNodes),
        }),
        setSaveStatus
      );

      // update neighbor floor's graph json
      savingHelper(
        "/api/updateEdgeAcrossFloors",
        JSON.stringify({
          floorCode: neighbors[neighborId].toFloorInfo?.toFloor,
          nodeId: neighborId,
          neighborId: nodeId,
        }),
        setSaveStatus
      );
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
          <EditTypeRow
            defaultType={neighbor.toFloorInfo?.type}
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
    <>
      <div className="mb-1 space-y-4">
        <GraphInfoButtons floorCode={floorCode} />
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
        {!floorCode.includes("outside") && (
          <AddEdgeAcrossFloorsSection floorCode={floorCode} />
        )}
      </div>
    </>
  );
};

export default GraphInfoDisplay;
