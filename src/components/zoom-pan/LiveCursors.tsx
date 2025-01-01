import React, { useContext, useEffect, useState } from "react";
import { GiArrowCursor } from "react-icons/gi";
import { Group, Path, Rect, Text } from "react-konva";

import { Presence, useOthers } from "../../liveblocks.config";
import { GraphContext } from "../contexts/GraphProvider";

interface Props {
  scale: number;
}

const LiveCursors = ({ scale }: Props) => {
  const others = useOthers();
  const { nodes, setNodes } = useContext(GraphContext);

  // const [myPresence, _updateMyPresence] = useMyPresence();

  const [textWidth, setTextWidth] = useState(0);
  const [textHeight, setTextHeight] = useState(0);

  // update node position if dragged by a user
  useEffect(() => {
    const newNodes = { ...nodes };

    others.forEach(({ presence }) => {
      if (presence.onDragNodeId && presence.nodePos) {
        const newNode = JSON.parse(
          JSON.stringify(newNodes[presence.onDragNodeId])
        );
        newNode.pos = presence.nodePos;
        newNodes[presence.onDragNodeId] = newNode;
      }
    });

    setNodes(newNodes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [others, setNodes]);

  const drawCursor = (connectionId, presence: Presence) => {
    const path = GiArrowCursor({}).props.children[0].props.d;

    // scale the svg to the size of an actual cursor
    const pathScale = 0.04 / scale;

    const nameOffset = { x: 10, y: 15 };
    const namePadding = 10;

    if (presence.cursor) {
      return (
        <>
          <Path
            key={connectionId}
            x={presence.cursor.x - 4 / scale}
            y={presence.cursor.y - 2 / scale}
            fill={presence.active ? "green" : "red"}
            data={path}
            scaleX={pathScale}
            scaleY={pathScale}
          />
          {presence.name && (
            <Group
              x={presence.cursor.x + nameOffset.x / scale}
              y={presence.cursor.y + nameOffset.y / scale}
            >
              <Rect
                width={textWidth + namePadding / scale}
                height={textHeight + namePadding / scale}
                fill="blue"
                cornerRadius={10 / scale}
              />
              <Text
                x={namePadding / scale / 2}
                y={namePadding / scale / 2}
                text={presence.name}
                fontSize={16 / scale}
                fill="white"
                ref={(node) => {
                  if (node) {
                    setTextWidth(node.width());
                    setTextHeight(node.height());
                  }
                }}
              />
            </Group>
          )}
        </>
      );
    }
  };

  // return drawCursor("", myPresence);

  return others.map(({ connectionId, presence }) => {
    if (presence.cursor === null) {
      return null;
    }
    return drawCursor(connectionId, presence);
  });
};

export default LiveCursors;
