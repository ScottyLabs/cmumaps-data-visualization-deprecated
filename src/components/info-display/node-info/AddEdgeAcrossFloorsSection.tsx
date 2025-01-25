import React, { useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import buildings from "../../../../public/cmumaps-data/buildings.json";
import { extractBuildingCode } from "../../../app/api/apiUtils";
import { getNode } from "../../../lib/apiRoutes";
import { setNodes } from "../../../lib/features/dataSlice";
import { useAddEdgeAcrossFloorsMutation } from "../../../lib/features/graphApiSlice";
import { getNodeIdSelected } from "../../../lib/features/mouseEventSlice";
import { setShortcutsDisabled } from "../../../lib/features/statusSlice";
import { useAppDispatch, useAppSelector } from "../../../lib/hooks";
import { connectedBuildings } from "../../shared/buildings";
import { EdgeType, EdgeTypeList, Nodes, Rooms } from "../../shared/types";

interface Props {
  floorCode: string;
  rooms: Rooms;
  nodes: Nodes;
}

const AddEdgeAcrossFloorsSection = ({ floorCode, rooms, nodes }: Props) => {
  const dispatch = useAppDispatch();

  const [addEdgeAcrossFloors] = useAddEdgeAcrossFloorsMutation();

  const floorLevels = useAppSelector((state) => state.floor.floorLevels);
  const nodeId = useAppSelector((state) => getNodeIdSelected(state.mouseEvent));

  const [toFloorCode, setToFloorCode] = useState("");
  const nodeIdRef = useRef<HTMLInputElement | null>(null);

  const connectedFloors = useMemo(() => {
    if (!floorLevels) {
      return [];
    }
    const buildingCode = extractBuildingCode(floorCode);
    const connectedFloors: string[] = [];

    // include floor above and below if possible
    const floorsArr = floorCode.split("-");
    const floorIndex = floorLevels.indexOf(floorsArr[floorsArr.length - 1]);
    const prefix = buildingCode + "-";
    if (floorIndex != floorLevels.length - 1) {
      connectedFloors.push(prefix + floorLevels[floorIndex + 1]);
    }
    if (floorIndex != 0) {
      connectedFloors.push(prefix + floorLevels[floorIndex - 1]);
    }

    // always include outside
    connectedFloors.push("outside");

    // add connected buildings
    const connectedBuilding: string[] = connectedBuildings[buildingCode];
    if (connectedBuilding) {
      const allAdditionalFloors: string[][] = connectedBuilding.map(
        (buildingCode) =>
          buildings[buildingCode].floors.map(
            (floor: string) => `${buildingCode}-${floor}`
          )
      );

      connectedFloors.push(...allAdditionalFloors.flat());
    }

    return connectedFloors;
  }, [floorCode, floorLevels]);

  const addEdgeWithID = async () => {
    const validate = async () => {
      const inNodeId = nodeId;
      if (!inNodeId) {
        // This case should be impossible because graph info is only displayed
        // when a node is selected
        return { error: "Please select a node first!" };
      }

      const outNodeId = nodeIdRef.current?.value;
      if (!outNodeId) {
        return { error: "Please input node id!" };
      }

      // check multi-edge
      if (outNodeId in nodes[nodeId].neighbors) {
        return { error: "Edge already existed!" };
      }

      // get node by node id
      const outNode = await getNode(outNodeId);
      if (!outNode) {
        return { error: "Invalid node id!" };
      }

      const outRoom = outNode.room;
      if (!outRoom) {
        return { error: "Given node doesn't belong to a room!" };
      }

      // if a room doesn't have a floor level, then it belongs to outside
      let floorLevel = "outside";
      if (outRoom.floorLevel) {
        floorLevel = `${outRoom.buildingCode}-${outRoom.floorLevel}`;
      }

      if (!toFloorCode) {
        return { error: "Select a Floor!" };
      }

      // check floor matches
      if (floorLevel !== toFloorCode) {
        return {
          error: `Given node belongs to floor ${floorLevel} instead of ${toFloorCode}!`,
        };
      }

      return { valid: true, inNodeId, outNodeId, outRoom };
    };

    const validateRes = await validate();
    if (!validateRes.valid) {
      toast.error(validateRes.error);
      return;
    }

    const { inNodeId, outNodeId, outRoom } = validateRes;

    // type non empty iff the two rooms share a type that is an edge type
    const getType = () => {
      if (outRoom.type == rooms[nodes[inNodeId].roomId].type) {
        if (EdgeTypeList.includes(outRoom.type)) {
          return outRoom.type as EdgeType;
        }
      }

      return "";
    };

    const type = getType();
    const outEdgeInfo = {
      toFloorInfo: {
        toFloor: `${outRoom.buildingCode}-${outRoom.floorLevel}`,
        type,
      },
    };
    const inEdgeInfo = { toFloorInfo: { toFloor: floorCode, type } };
    addEdgeAcrossFloors({
      floorCode,
      inNodeId,
      outEdgeInfo,
      outNodeId,
      inEdgeInfo,
    });

    // clear inputs
    // setToFloorCode("");
    // if (nodeIdRef.current) {
    //   nodeIdRef.current.value = "";
    // }
  };

  const renderFloorSelector = () => {
    const handleChange = (event) => {
      setToFloorCode(event.target.value);
    };

    return (
      <div>
        <select
          name="floor"
          id="floor"
          className="rounded text-black"
          value={toFloorCode}
          onChange={handleChange}
        >
          <option value="" disabled>
            --Please choose a floor--
          </option>
          {connectedFloors.map((floor) => (
            <option key={floor} value={floor}>
              {floor}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const renderAutoDetectButton = () => {
    const autoDetect = async () => {
      if (!toFloorCode) {
        toast.error("Select a Floor!");
        return;
      }
      const response = await fetch("/api/addEdgeAcrossFloors", {
        method: "POST",
        body: JSON.stringify({
          floorCode1: floorCode,
          floorCode2: toFloorCode,
          nodeId1: nodeId,
        }),
      });

      const body = await response.json();

      // handle error
      if (!response.ok) {
        if (response.status == 500) {
          console.error(body.error);
        } else if (response.status == 400) {
          toast.error(body.error);
        }
        return;
      }

      toast.info(body.message);

      dispatch(setNodes(body.newGraph));

      // clear inputs
      setToFloorCode("");
      if (nodeIdRef.current) {
        nodeIdRef.current.value = "";
      }
    };

    return (
      <div>
        <button
          className="mt-4 rounded bg-slate-500 px-2 py-1 text-sm text-white hover:bg-slate-700"
          onClick={autoDetect}
        >
          Autodetect
        </button>
      </div>
    );
  };

  const renderAddButton = () => {
    return (
      <div>
        <button
          className="my-1 rounded bg-slate-500 px-2 py-1 text-sm text-white hover:bg-slate-700"
          onClick={addEdgeWithID}
        >
          Add
        </button>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center space-x-3">
        <p>Add Edge across Floors</p>
        {renderAddButton()}
      </div>
      <div className="space-y-2">
        {renderFloorSelector()}
        <div>
          <input
            ref={nodeIdRef}
            placeholder="Node ID"
            className="rounded px-2 text-black"
            onFocus={() => dispatch(setShortcutsDisabled(true))}
            onBlur={() => dispatch(setShortcutsDisabled(false))}
          />
        </div>
      </div>
      {renderAutoDetectButton()}
    </div>
  );
};

export default AddEdgeAcrossFloorsSection;
