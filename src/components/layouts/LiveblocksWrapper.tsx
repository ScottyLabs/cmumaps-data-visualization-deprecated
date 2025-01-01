import React from "react";

import { RoomProvider } from "../../liveblocks.config";
import { LIVEBLOCKS_ENABLED } from "../../settings";

interface Props {
  floorCode: string;
  children: React.ReactNode;
}

const LiveblocksWrapper = ({ floorCode, children }: Props) => {
  if (!LIVEBLOCKS_ENABLED) {
    return children;
  }

  return (
    <RoomProvider
      id={floorCode}
      initialPresence={{
        name: null,
        cursor: null,
        active: false,
        onDragNodeId: null,
        nodePos: null,
      }}
    >
      {children}
    </RoomProvider>
  );
};

export default LiveblocksWrapper;
