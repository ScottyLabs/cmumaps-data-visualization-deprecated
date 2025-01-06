import React, { useEffect, useState } from "react";
import { GiArrowCursor } from "react-icons/gi";
import { Group, Path, Rect, Text } from "react-konva";

import { User } from "../../lib/features/usersSlice";
import { PDFCoordinate } from "../shared/types";
import { CURSOR_INTERVAL } from "./LiveCursors";

interface Props {
  user: User;
  cursorPosList: PDFCoordinate[] | undefined;
  scale: number;
}

const LiveCursor = ({ user, cursorPosList, scale }: Props) => {
  const [cursorPosIndex, setCursorPosIndex] = useState(0);

  // increment cursorPosIndex
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCursorPosIndex((prev) => {
        if (cursorPosList && prev < cursorPosList.length - 1) {
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

  const [textWidth, setTextWidth] = useState(0);
  const [textHeight, setTextHeight] = useState(0);

  if (!cursorPosList) {
    return;
  }

  const drawLiveCursor = () => {
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
            fill={user.color}
            data={path}
            scaleX={pathScale}
            scaleY={pathScale}
          />
          <Group
            x={cursor.x + nameOffset.x / scale}
            y={cursor.y + nameOffset.y / scale}
          >
            <Rect
              width={textWidth + namePadding / scale}
              height={textHeight + namePadding / scale}
              fill={user.color}
              cornerRadius={10 / scale}
            />
            <Text
              x={namePadding / scale / 2}
              y={namePadding / scale / 2}
              text={user.userName}
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
        </>
      );
    }
  };

  return drawLiveCursor();
};

export default LiveCursor;
