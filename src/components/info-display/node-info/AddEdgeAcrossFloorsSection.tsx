import React, { useContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import { getNodeIdSelected } from "../../../lib/features/mouseEventSlice";
import { setShortcutsDisabled } from "../../../lib/features/statusSlice";
import { useAppDispatch, useAppSelector } from "../../../lib/hooks";
import { GraphContext } from "../../contexts/GraphProvider";
import { connectedBuildings } from "../../shared/buildings";
import { Floor } from "../../shared/types";

interface Props {
  floorCode: string;
}

const AddEdgeAcrossFloorsSection = ({ floorCode }: Props) => {
  const dispatch = useAppDispatch();

  const floorLevels = useAppSelector((state) => state.data.floorLevels);

  const { setNodes } = useContext(GraphContext);
  const nodeIdSelected = useAppSelector((state) =>
    getNodeIdSelected(state.mouseEvent)
  );

  const [floorCode2, setFloorCode2] = useState("");
  const nodeIdRef = useRef<HTMLInputElement | null>(null);
  const [additionalFloors, setAdditionalFloors] = useState<Floor[]>([]);

  // get the additional floors this building can connect to
  useEffect(() => {
    const buildingCode = floorCode.split("-")[0];
    const connectedBuilding = connectedBuildings[buildingCode];

    if (connectedBuilding) {
      const promises = connectedBuilding.map(async (connectedBuilding) => {
        const response = await fetch(
          `/api/getFloorCodes?buildingCode=${connectedBuilding}`,
          {
            method: "GET",
          }
        );

        const body = await response.json();

        // handle error
        if (!response.ok) {
          console.error(body.error);
          return [];
        }
        return body.newFloorLevels.map(
          (floorLevel: string) => connectedBuilding + "-" + floorLevel
        );
      });

      Promise.all(promises).then((response) =>
        setAdditionalFloors(response.flat())
      );
    }
  }, [floorCode]);

  if (!floorLevels) {
    return;
  }

  const addEdgeWithID = async () => {
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

    setNodes(body.newGraph);

    // clear inputs
    setFloorCode2("");
    if (nodeIdRef.current) {
      nodeIdRef.current.value = "";
    }
  };

  const renderFloorSelector = () => {
    const floorsArr = floorCode.split("-");
    const floorIndex = floorLevels.indexOf(floorsArr[floorsArr.length - 1]);
    const prefix = floorsArr[0] + "-";

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
          {floorIndex != floorLevels.length - 1 && (
            <option value={prefix + floorLevels[floorIndex + 1]}>
              {prefix + floorLevels[floorIndex + 1]}
            </option>
          )}
          {floorIndex != 0 && (
            <option value={prefix + floorLevels[floorIndex - 1]}>
              {prefix + floorLevels[floorIndex - 1]}
            </option>
          )}
          <option value="outside-1">Campus Outside</option>
          {additionalFloors.map((floor) => (
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

      setNodes(body.newGraph);

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
