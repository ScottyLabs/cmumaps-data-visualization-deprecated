import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_API_KEY || "",
  throttle: 16, // 60fps
});

export type Presence = {
  name: string | null;
  cursor: { x: number; y: number } | null;
  onDragNodeId: string | null;
  nodePos: { x: number; y: number } | null;
  active: boolean;
};

export const {
  suspense: { RoomProvider, useMyPresence, useOthers },
} = createRoomContext<Presence>(client);
