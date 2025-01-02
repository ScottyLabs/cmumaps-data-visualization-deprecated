import { useRouter } from "next/navigation";

import React, { useContext } from "react";
import { TfiLocationPin } from "react-icons/tfi";
import { Group, Path, Rect } from "react-konva";

import { DOOR, getNodeIdSelected } from "../../lib/features/mouseEventSlice";
import { useAppSelector } from "../../lib/hooks";
import { GraphContext } from "../contexts/GraphProvider";
import { OutlineContext } from "../contexts/OutlineProvider";
import { RoomsContext } from "../contexts/RoomsProvider";
import { SaveStatusContext } from "../contexts/SaveStatusProvider";
import { VisibilitySettingsContext } from "../contexts/VisibilitySettingsProvider";
import { RoomInfo } from "../shared/types";
import { getRoomId, savingHelper, setCursor } from "../utils/utils";

interface Props {
  floorCode: string;
  addNewNode;
}

const LabelsDisplay = ({ floorCode, addNewNode }: Props) => {
  const router = useRouter();

  const editRoomLabel = useAppSelector((state) => state.ui.editRoomLabel);

  const { showLabels } = useContext(VisibilitySettingsContext);
  const { doors } = useContext(OutlineContext);
  const { rooms, setRooms } = useContext(RoomsContext);
  const { nodes } = useContext(GraphContext);
  const setSaveStatus = useContext(SaveStatusContext);

  const idSelected = useAppSelector((state) => state.mouseEvent.idSelected);
  const nodeId = useAppSelector((state) => getNodeIdSelected(state.mouseEvent));
  const roomIdSelected = getRoomId(nodes, nodeId);

  const path = TfiLocationPin({}).props.children[1].props.d;
  const viewBox = TfiLocationPin({}).props.attr.viewBox.split(" ");
  const width = Number(viewBox[2]);
  const height = Number(viewBox[3]);

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
        const newRoomInfo: RoomInfo = {
          ...rooms[roomId],
          labelPosition: {
            x: Number((e.target.x() + width / 2).toFixed(2)),
            y: Number((e.target.y() + height).toFixed(2)),
          },
        };
        const newRooms = Object.assign(rooms, {});
        newRooms[roomId] = newRoomInfo;
        setRooms(newRooms);
        savingHelper(
          "/api/updateRoomInfo",
          JSON.stringify({
            floorCode: floorCode,
            roomId: roomId,
            newRoomInfo: newRoomInfo,
          }),
          setSaveStatus
        );
      };

      const handleClick = () => {
        const nodeInfo = Object.entries(nodes).filter(
          (nodeInfo) => nodeInfo[1].roomId == roomId
        )[0];

        if (nodeInfo) {
          router.push(`${floorCode}?nodeId=${nodeInfo[0]}`);
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
