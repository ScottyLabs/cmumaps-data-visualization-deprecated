import { v4 as uuidv4 } from "uuid";

import React from "react";

import { extractFloorLevel } from "../../../app/api/apiUtils";
import { useUpdateNodeMutation } from "../../../lib/features/graphApiSlice";
import { useUpsertRoomMutation } from "../../../lib/features/roomApiSlice";
import { ID, Nodes, RoomInfo } from "../../shared/types";
import { getRoomIdFromRoomInfo } from "../../utils/utils";

interface Props {
  floorCode: string;
  nodes: Nodes;
  nodeId: ID;
}

const CreateRoomDisplay = ({ floorCode, nodes, nodeId }: Props) => {
  const [upsertRoom] = useUpsertRoomMutation();
  const [updateNode] = useUpdateNodeMutation();

  const createRoom = async () => {
    const floorLevel = extractFloorLevel(floorCode);
    const name = floorLevel + ":" + uuidv4().replace(/-/g, "");
    const newRoom: RoomInfo = {
      name,
      labelPosition: nodes[nodeId].pos,
      type: "",
      displayAlias: "",
      aliases: [],
      polygon: {
        type: "Polygon",
        coordinates: [[]],
      },
      updatedAt: new Date().toISOString(),
    };
    const roomId = getRoomIdFromRoomInfo(floorCode, newRoom);
    const oldRoom = null;
    await upsertRoom({ floorCode, roomId, newRoom, oldRoom });

    const newNode = JSON.parse(JSON.stringify(nodes[nodeId]));
    newNode.roomId = roomId;
    updateNode({ floorCode, nodeId, newNode });
  };

  return (
    <button
      className="mr-2 rounded bg-red-500 p-1 text-sm text-white hover:bg-red-700"
      onClick={createRoom}
    >
      Create Room
    </button>
  );
};

export default CreateRoomDisplay;
