import React from "react";

import { useAppSelector } from "../../lib/hooks";
import { Graph } from "../shared/types";
import LiveCursor from "./LiveCursor";

interface Props {
  scale: number;
  nodes: Graph;
}

export const CURSOR_INTERVAL = 20;

const LiveCursors = ({ scale }: Props) => {
  const otherUsers = useAppSelector((state) => state.users.otherUsers);
  const liveCursors = useAppSelector((state) => state.users.liveCursors);

  return Object.entries(otherUsers).map(([userId, user]) => (
    <LiveCursor
      key={userId}
      user={user}
      cursorPosList={liveCursors[userId]}
      scale={scale}
    />
  ));

  // // update node position if dragged by a user
  // useEffect(() => {
  //   const newNodes = { ...nodes };

  //   others.forEach(({ presence }) => {
  //     if (presence.onDragNodeId && presence.nodePos) {
  //       const newNode = JSON.parse(
  //         JSON.stringify(newNodes[presence.onDragNodeId])
  //       );
  //       newNode.pos = presence.nodePos;
  //       newNodes[presence.onDragNodeId] = newNode;
  //     }
  //   });

  //   dispatch(setNodes(newNodes));
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [others]);
};

export default LiveCursors;
