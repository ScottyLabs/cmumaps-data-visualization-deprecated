import { useRouter } from "next/navigation";

import React from "react";
import { TfiLocationPin } from "react-icons/tfi";
import { Group, Path, Rect } from "react-konva";

import { DOOR, getNodeIdSelected } from "../../lib/features/mouseEventSlice";
import { useUpsertRoomMutation } from "../../lib/features/roomApiSlice";
import { useAppSelector } from "../../lib/hooks";
import { Nodes, RoomInfo, Rooms } from "../shared/types";
import { setCursor } from "../utils/canvasUtils";
import { getRoomId } from "../utils/utils";

interface Props {
  floorCode: string;
  nodes: Nodes;
  rooms: Rooms;
  addNewNode;
}

const LabelsDisplay = ({ floorCode, nodes, rooms, addNewNode }: Props) => {
  const router = useRouter();

  const editRoomLabel = useAppSelector((state) => state.ui.editRoomLabel);
  const showLabels = useAppSelector((state) => state.visibility.showLabels);

  const [upsertRoom] = useUpsertRoomMutation();

  const doors = useAppSelector((state) => state.outline.doors);

  const idSelected = useAppSelector((state) => state.mouseEvent.idSelected);
  const nodeId = useAppSelector((state) => getNodeIdSelected(state.mouseEvent));
  const roomIdSelected = getRoomId(nodes, nodeId);

  const path = TfiLocationPin({}).props.children[1].props.d;
  const viewBox = TfiLocationPin({}).props.attr.viewBox.split(" ");
  const width = Number(viewBox[2]);
  const height = Number(viewBox[3]);

  if (!doors) {
    return;
  }

  return Object.entries(rooms).map(([roomId, roomInfo]) => {
    // selected if it is edit label mode and it is the label of the selected room
    // or the room of the label is connected by the selected door
    const selected =
      (editRoomLabel && roomIdSelected == roomId) ||
      (idSelected.type == DOOR &&
        doors[idSelected.id].roomIds.includes(roomId));

    // show label if in show all lables mode or "selected" (see above)
    if (showLabels || selected) {
      const draggable = editRoomLabel && roomIdSelected == roomId;

      const handleOnDragEnd = (e) => {
        const oldRoom = rooms[roomId];
        const newRoom: RoomInfo = {
          ...oldRoom,
          labelPosition: {
            x: Number((e.target.x() + width / 2).toFixed(2)),
            y: Number((e.target.y() + height).toFixed(2)),
          },
        };
        upsertRoom({ floorCode, roomId, newRoom, oldRoom });
      };

      const handleClick = () => {
        const nodeInfo = Object.entries(nodes).filter(
          (nodeInfo) => nodeInfo[1].roomId == roomId
        )[0];

        if (nodeInfo) {
          router.push(`?nodeId=${nodeInfo[0]}`);
        } else {
          addNewNode({
            pos: roomInfo.labelPosition,
            neighbors: {},
            roomId: roomId,
          });
        }
      };

      return (
        <Group
          x={roomInfo.labelPosition.x - width / 2}
          y={roomInfo.labelPosition.y - height}
          key={roomId}
          draggable={draggable}
          onClick={handleClick}
          onDragEnd={(e) => handleOnDragEnd(e)}
          onMouseEnter={(e) => setCursor(e, "pointer")}
          onMouseLeave={(e) => setCursor(e, "default")}
        >
          <Path fill={selected ? "orange" : "indigo"} data={path} />
          <Rect width={Number(width)} height={Number(height)} />
        </Group>
      );
    }
  });
};

export default LabelsDisplay;
