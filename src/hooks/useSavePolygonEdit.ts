import { Polygon } from "geojson";

import { RoomInfo } from "../components/shared/types";
import { useGetRoomsQuery } from "../lib/features/apiSlice";
import { useUpsertRoomMutation } from "../lib/features/roomApiSlice";

const useSavePolygonEdit = (floorCode: string, roomId: string) => {
  const { data: rooms } = useGetRoomsQuery(floorCode);
  const [upsertRoom] = useUpsertRoomMutation();

  const savePolygonEdit = async (polygon: Polygon) => {
    if (rooms) {
      const oldRoom = rooms[roomId];
      const newRoom: RoomInfo = { ...oldRoom, polygon };
      await upsertRoom({ floorCode, roomId, newRoom, oldRoom });
    }
  };

  return savePolygonEdit;
};

export default useSavePolygonEdit;
