import React, { useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import buildings from "../../../../public/cmumaps-data/buildings.json";
import { extractBuildingCode } from "../../../app/api/apiUtils";
import { getNode } from "../../../lib/apiRoutes";
import { setNodes } from "../../../lib/features/dataSlice";
import { getNodeIdSelected } from "../../../lib/features/mouseEventSlice";
import { setShortcutsDisabled } from "../../../lib/features/statusSlice";
import { useAppDispatch, useAppSelector } from "../../../lib/hooks";
import { connectedBuildings } from "../../shared/buildings";

interface Props {
  floorCode: string;
}

const AddEdgeAcrossFloorsSection = ({ floorCode }: Props) => {
  const dispatch = useAppDispatch();

  const floorLevels = useAppSelector((state) => state.floor.floorLevels);
  const nodeIdSelected = useAppSelector((state) =>
    getNodeIdSelected(state.mouseEvent)
  );

  const [floorCode2, setFloorCode2] = useState("");
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
    const outNodeId = nodeIdRef.current?.value;
    if (!outNodeId) {
      toast.error("Please input node id!");
      return;
    }

    const node = await getNode(outNodeId);

    if (!node) {
      toast.error("Invalid node id!");
      return;
    }

    console.log(node.room);

    return;

    if (!floorCode2) {
      toast.error("Select a Floor!");
      return;
    }

    const response = await fetch("/api/addEdgeAcrossFloors", {
      method: "POST",
      body: JSON.stringify({
        floorCode1: floorCode,
        floorCode2: floorCode2,
        nodeId1: nodeIdSelected,
        nodeId2: nodeIdRef.current?.value,
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
    setFloorCode2("");
    if (nodeIdRef.current) {
      nodeIdRef.current.value = "";
    }
  };

  const renderFloorSelector = () => {
    const handleChange = (event) => {
      setFloorCode2(event.target.value);
    };

    return (
      <div>
        <select
          name="floor"
          id="floor"
          className="rounded text-black"
          value={floorCode2}
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
      if (!floorCode2) {
        toast.error("Select a Floor!");
        return;
      }
      const response = await fetch("/api/addEdgeAcrossFloors", {
        method: "POST",
        body: JSON.stringify({
          floorCode1: floorCode,
          floorCode2: floorCode2,
          nodeId1: nodeIdSelected,
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
      setFloorCode2("");
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

  return (
    <div>
      <div className="flex items-center space-x-3">
        <p>Add Edge across Floors</p>
        <div>
          <button
            className="my-1 rounded bg-slate-500 px-2 py-1 text-sm text-white hover:bg-slate-700"
            onClick={addEdgeWithID}
          >
            Add
          </button>
        </div>
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
