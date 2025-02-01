import React from "react";

import { savingHelper } from "../../../lib/apiRoutes";
import { useUpsertRoomMutation } from "../../../lib/features/api/roomApiSlice";
import { setNodes } from "../../../lib/features/dataSlice";
import { getNodeIdSelected } from "../../../lib/features/mouseEventSlice";
import { useAppDispatch, useAppSelector } from "../../../lib/hooks";
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
import EditTypeCell from "../EditTypeCell";
import AliasesMultiSelect from "./AliasesMultiSelect";
import CreateRoomDisplay from "./CreateRoomDisplay";
import RoomInfoButtons from "./RoomInfoTable";

interface Props {
  floorCode: string;
  rooms: Rooms;
  nodes: Nodes;
}

const RoomInfoDisplay = ({ floorCode, rooms, nodes }: Props) => {
  const dispatch = useAppDispatch();

  const [upsertRoom] = useUpsertRoomMutation();

  const nodeId = useAppSelector((state) => getNodeIdSelected(state.mouseEvent));

  if (!nodeId) {
    return;
  }

  const roomId = getRoomId(nodes, nodeId);
  const room = rooms[roomId];

  if (!roomId) {
    return (
      <CreateRoomDisplay floorCode={floorCode} nodes={nodes} nodeId={nodeId} />
    );
  }

  const renderRoomIdRow = () => {
    return (
      <tr>
        {renderCell("Room ID")}
        {renderCell(roomId, "truncate")}
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
    // setRooms(newRooms);

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
        <EditTypeCell
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
        <td className="border p-2 text-black">
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
      <table className="w-72 table-fixed">
        <thead>
          <tr>
            {renderCell("Property", "font-bold w-28")}
            {renderCell("Value", "font-bold")}
          </tr>
        </thead>
        <tbody>
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
