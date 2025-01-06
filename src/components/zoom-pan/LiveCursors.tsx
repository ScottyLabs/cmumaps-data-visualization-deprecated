import React, { useEffect, useState } from "react";
import { GiArrowCursor } from "react-icons/gi";
import { Group, Path, Rect, Text } from "react-konva";

import { setNodes } from "../../lib/features/dataSlice";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import { Presence } from "../../liveblocks.config";
import { Graph } from "../shared/types";

interface Props {
  scale: number;
  nodes: Graph;
}

export const CURSOR_INTERVAL = 20;

const LiveCursors = ({ scale }: Props) => {
  // const dispatch = useAppDispatch();
  const cursorPosList = useAppSelector((state) => state.users.liveCursors);
  const [cursorPosIndex, setCursorPosIndex] = useState(0);

  const [textWidth, setTextWidth] = useState(0);
  const [textHeight, setTextHeight] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCursorPosIndex((prev) => {
        if (prev < cursorPosList.length - 1) {
          return prev + 1;
        } else {
          return prev;
        }
      });
    }, CURSOR_INTERVAL);

    return () => {
      setCursorPosIndex(0);
      clearInterval(intervalId);
    };
  }, [cursorPosList]);

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

  // const drawCursor = (connectionId, presence: Presence) => {
  const path = GiArrowCursor({}).props.children[0].props.d;

  // scale the svg to the size of an actual cursor
  const pathScale = 0.04 / scale;

  const nameOffset = { x: 10, y: 15 };
  const namePadding = 10;

  if (cursorPosIndex < cursorPosList.length) {
    const cursor = cursorPosList[cursorPosIndex];
    return (
      <>
        <Path
          x={cursor.x - 4 / scale}
          y={cursor.y - 2 / scale}
          // fill={presence.active ? "green" : "red"}
          fill={"green"}
          data={path}
          scaleX={pathScale}
          scaleY={pathScale}
        />
        {/* {presence.name && (
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
        )} */}
      </>
    );
  }

  // return drawCursor();

  // return others.map(({ connectionId, presence }) => {
  //   if (presence.cursor === null) {
  //     return null;
  //   }
  //   return drawCursor(connectionId, presence);
  // });

  return <></>;
};

export default LiveCursors;
