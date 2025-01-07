import React, { useEffect, useState } from "react";
import { GiArrowCursor } from "react-icons/gi";
import { Group, Path, Rect, Text } from "react-konva";

import {
  selectLiveCursor,
  updateLiveCursor,
  User,
} from "../../lib/features/usersSlice";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import { CURSOR_INTERVAL } from "./LiveCursors";

interface Props {
  userId: string;
  user: User;
  scale: number;
}

const LiveCursor = ({ userId, user, scale }: Props) => {
  const dispatch = useAppDispatch();
  const cursorInfoList = useAppSelector((state) =>
    selectLiveCursor(state, userId)
  );

  // keep popping off the first element of cursor info list
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (cursorInfoList.length > 0) {
        dispatch(
          updateLiveCursor({
            sender: userId,
            cursorInfoList: cursorInfoList.slice(1),
          })
        );
      }
    }, CURSOR_INTERVAL);

    return () => clearInterval(intervalId);
  }, [cursorInfoList]);

  const [textWidth, setTextWidth] = useState(0);
  const [textHeight, setTextHeight] = useState(0);

  if (!cursorInfoList) {
    return;
  }

  const cursorPos = cursorInfoList[0].cursorPos;
  const renderCursor = () => {
    const path = GiArrowCursor({}).props.children[0].props.d;

    // scale the svg to the size of an actual cursor
    const pathScale = 0.04 / scale;

    return (
      <Path
        x={cursorPos.x - 4 / scale}
        y={cursorPos.y - 2 / scale}
        fill={user.color}
        data={path}
        scaleX={pathScale}
        scaleY={pathScale}
      />
    );
  };

  const renderName = () => {
    const nameOffset = { x: 10, y: 15 };
    const namePadding = 10;

    return (
      <Group
        x={cursorPos.x + nameOffset.x / scale}
        y={cursorPos.y + nameOffset.y / scale}
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
    );
  };

  return (
    cursorPos && (
      <>
        {renderCursor()}
        {renderName()}
      </>
    )
  );
};

export default LiveCursor;
