import React from "react";
import { CiUser } from "react-icons/ci";

import { useAppSelector } from "../../lib/hooks";

const UserCount = () => {
  const otherUsers = useAppSelector((state) => state.users.otherUsers);

  return (
    <div className="absolute top-16 h-full">
      <div className="sticky top-4 m-2">
        <div className="flex items-center">
          <CiUser fill="blue" />
          {Object.keys(otherUsers).length + 1}
        </div>
        {/* <div className="flex items-center gap-1">
          <input type="checkbox" id="MultiplayerCursorName" />
          <label htmlFor="MultiplayerCursorName">Show Cursor Name</label>
        </div> */}
      </div>
    </div>
  );
};

export default UserCount;
