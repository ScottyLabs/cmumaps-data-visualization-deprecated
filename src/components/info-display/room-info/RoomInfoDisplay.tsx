import { v4 as uuidv4 } from "uuid";

import React, { useContext } from "react";

import { extractFloorLevel } from "../../../app/api/apiUtils";
import { savingHelper } from "../../../lib/apiRoutes";
import { setNodes } from "../../../lib/features/dataSlice";
import { getNodeIdSelected } from "../../../lib/features/mouseEventSlice";
import { useUpdateNodeMutation } from "../../../lib/features/nodeApiSlice";
import { useUpsertRoomMutation } from "../../../lib/features/roomApiSlice";
import { useAppDispatch, useAppSelector } from "../../../lib/hooks";
import { RoomsContext } from "../../contexts/RoomsProvider";
import {
  NodeInfo,
  Nodes,
  RoomInfo,
  Rooms,
  RoomTypeList,
} from "../../shared/types";
import { renderCell } from "../../utils/displayUtils";
import { getRoomId, getRoomIdFromRoomInfo } from "../../utils/utils";
import EditCell from "../EditCell";
import EditTypeRow from "../SelectTypeCell";
import AliasesMultiSelect from "./AliasesMultiSelect";
import RoomInfoButtons from "./RoomInfoTable";

interface Props {
  floorCode: string;
  rooms: Rooms;
  nodes: Nodes;
}

const RoomInfoDisplay = ({ floorCode, rooms, nodes }: Props) => {
  const dispatch = useAppDispatch();

  const [upsertRoom] = useUpsertRoomMutation();
  const [updateNode] = useUpdateNodeMutation();

  const { setRooms } = useContext(RoomsContext);
  const nodeId = useAppSelector((state) => getNodeIdSelected(state.mouseEvent));

  const roomId = getRoomId(nodes, nodeId);
  const room = rooms[roomId];

  if (!roomId) {
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
        updatedAt: "",
      };
      const roomId = getRoomIdFromRoomInfo(floorCode, newRoom);
      const oldRoom = rooms[roomId];
      await upsertRoom({ floorCode, roomId, newRoom, oldRoom });

      const newNode = JSON.parse(JSON.stringify(nodes[nodeId]));
      newNode.roomId = roomId;
      const oldNode = nodes[nodeId];
      updateNode({ floorCode, nodeId, newNode, oldNode });
    };

    return (
      <button
        className="mr-2 rounded bg-red-500 p-1 text-sm text-white hover:bg-red-700"
        onClick={createRoom}
      >
        Create Room
      </button>
    );
  }

  const renderRoomIdRow = () => {
    return (
      <tr>
        {renderCell("Room ID")}
        {renderCell(roomId)}
      </tr>
    );
  };

  const handleSaveHelper = async (roomInfo: RoomInfo) => {
    upsertRoom({
      floorCode,
      roomId,
      newRoom: roomInfo,
      oldRoom: rooms[roomId],
    });

    return;

    // frontend update
    const newRooms = { ...rooms };
    const newRoomId = getRoomIdFromRoomInfo(floorCode, roomInfo);

    // if room id changed, then need to do extra things
    if (newRoomId != roomId) {
      // need to update roomId of nodes belonging to this room
      const newNodes = { ...nodes };
      for (const nodeId in newNodes) {
        if (nodes[nodeId].roomId == roomId) {
          const newNode: NodeInfo = JSON.parse(
            JSON.stringify(newNodes[nodeId])
          );
          newNode.roomId = newRoomId;
          newNodes[nodeId] = newNode;
        }
      }
      dispatch(setNodes(newNodes));

      // need to delete the old room entry
      delete newRooms[roomId];
    }

    // if room id didn't change, then only need to reassign
    newRooms[newRoomId] = roomInfo;
    setRooms(newRooms);

    // backend update
    const succeeded = savingHelper(
      "/api/room/update",
      JSON.stringify({
        floorCode,
        roomId,
        roomData: roomInfo,
      })
    );

    return succeeded;
  };

  const renderEditNameRow = () => {
    const handleSaveName = async (
      editedValue,
      setEditedValue,
      setIsEditing
    ) => {
      setIsEditing(false);
      const newRoomInfo = { ...room, name: editedValue };
      const succeeded = await handleSaveHelper(newRoomInfo);

      // revert input field if saving failed
      if (!succeeded) {
        setEditedValue(room.name);
      }
    };

    return (
      <tr>
        <td className="border pl-4 pr-4">Name</td>
        <EditCell
          property="name"
          value={room.name}
          handleSave={handleSaveName}
        />
      </tr>
    );
  };

  const renderEditTypeRow = () => {
    const handleChange = (setSelectedOption) => async (newValue) => {
      if (newValue.value !== room.type) {
        setSelectedOption(newValue);
        const newRoomInfo = { ...room, type: newValue.value };
        handleSaveHelper(newRoomInfo);
      }
    };

    return (
      <tr>
        <td className="border pl-4 pr-4">Type</td>
        <EditTypeRow
          key={roomId}
          value={room.type}
          typeList={RoomTypeList as readonly string[]}
          handleChange={handleChange}
        />
      </tr>
    );
  };

  const renderEditAliasesRow = () => {
    return (
      <tr>
        <td className="border pl-4 pr-4">Aliases</td>
        <td className="flex w-48 border p-2 text-black">
          <AliasesMultiSelect
            key={roomId}
            room={room}
            handleSaveHelper={handleSaveHelper}
          />
        </td>
      </tr>
    );
  };

  return (
    <>
      <table className="table-auto">
        <tbody>
          <tr>
            {renderCell("Property", "font-bold")}
            {renderCell("Value", "font-bold")}
          </tr>
          {renderRoomIdRow()}
          {renderEditNameRow()}
          {renderEditTypeRow()}
          {renderEditAliasesRow()}
          <RoomInfoButtons floorCode={floorCode} nodes={nodes} />
        </tbody>
      </table>
    </>
  );
};

export default RoomInfoDisplay;
