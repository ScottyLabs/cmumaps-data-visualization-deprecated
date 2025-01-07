import React, { memo } from "react";
import { useEffect, useState } from "react";
import { GiArrowCursor } from "react-icons/gi";
import { Group, Path, Rect, Text } from "react-konva";

import {
  moveNodeWithCursor,
  selectCursorInfoList,
  updateCursorInfoList,
  User,
} from "../../lib/features/usersSlice";
import { useAppSelector } from "../../lib/hooks";
import { useAppDispatch } from "../../lib/hooks";
import { PDFCoordinate } from "../shared/types";

interface LiveCursorsProps {
  floorCode: string;
  scale: number;
}

export const CURSOR_INTERVAL = 20;

const LiveCursors = memo(({ floorCode, scale }: LiveCursorsProps) => {
  const otherUsers = useAppSelector((state) => state.users.otherUsers);
  return Object.entries(otherUsers).map(([userId, user]) => (
    <LiveCursor
      key={userId}
      floorCode={floorCode}
      userId={userId}
      user={user}
      scale={scale}
    />
  ));
});

interface LiveCursorProps {
  floorCode: string;
  userId: string;
  user: User;
  scale: number;
}

const LiveCursor = ({ floorCode, userId, user, scale }: LiveCursorProps) => {
  const dispatch = useAppDispatch();
  const cursorInfoList = useAppSelector((state) =>
    selectCursorInfoList(state, userId)
  );

  // keep popping off the first element of cursor info list
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (cursorInfoList && cursorInfoList.length > 1) {
        dispatch(
          updateCursorInfoList({
            sender: userId,
            cursorInfoList: cursorInfoList.slice(1),
          })
        );

        if ("nodeId" in cursorInfoList[0]) {
          dispatch(
            moveNodeWithCursor({ cursorInfo: cursorInfoList[0], floorCode })
          );
        }
      }
    }, CURSOR_INTERVAL);

    return () => clearInterval(intervalId);
  }, [cursorInfoList, dispatch, floorCode, userId]);

  if (!cursorInfoList || cursorInfoList.length === 0) {
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

  return (
    cursorPos && (
      <>
        {renderCursor()}
        <CursorNameRect user={user} cursorPos={cursorPos} scale={scale} />
      </>
    )
  );
};

interface CursorNameRectProps {
  user: User;
  cursorPos: PDFCoordinate;
  scale: number;
}

const CursorNameRect = ({ user, cursorPos, scale }: CursorNameRectProps) => {
  const [textWidth, setTextWidth] = useState(0);
  const [textHeight, setTextHeight] = useState(0);

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

LiveCursors.displayName = "LiveCursors";

export default LiveCursors;
