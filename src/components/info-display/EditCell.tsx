import React, { useEffect, useState } from "react";
import { FaCheck, FaPencilAlt } from "react-icons/fa";

import { setShortcutsDisabled } from "../../lib/features/statusSlice";
import { useAppDispatch } from "../../lib/hooks";

interface Props {
  property: string;
  value: string | undefined;
  handleSave;
}

const EditCell = ({ property, value, handleSave }: Props) => {
  const dispatch = useAppDispatch();

  const [isEditing, setIsEditing] = useState(false);

  const [editedValue, setEditedValue] = useState<string | undefined>(value);

  // the component doesn't unmount when directly clicking between rooms
  // thus we need this useEffect to have the correct default editedValue
  useEffect(() => {
    setEditedValue(value);
  }, [value]);

  const renderValueCell = () => {
    if (isEditing) {
      return (
        <div className="my-1 flex justify-between">
          <input
            id={property}
            className="flex h-7 w-full rounded border border-gray-300 px-1 py-0.5"
            type="text"
            value={editedValue}
            onChange={(e) => setEditedValue(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSave(editedValue, setEditedValue, setIsEditing);
                dispatch(setShortcutsDisabled(false));
              }
            }}
            onBlur={() => {
              setEditedValue(value);
              dispatch(setShortcutsDisabled(false));
              setIsEditing(false);
            }}
            autoFocus
          />
          <FaCheck
            className="ml-2 flex cursor-pointer text-2xl text-white hover:text-gray-400"
            onMouseDown={() => {
              handleSave(editedValue, setEditedValue, setIsEditing);
              dispatch(setShortcutsDisabled(false));
            }}
          />
        </div>
      );
    } else {
      return (
        <div className="flex justify-between">
          <div className="h-7 truncate text-lg text-white">{value}</div>
          <FaPencilAlt
            className="ml-2 mt-1 flex-none cursor-pointer text-right text-white hover:text-gray-400"
            onClick={() => {
              setIsEditing(true);
              dispatch(setShortcutsDisabled(true));
            }}
          />
        </div>
      );
    }
  };

  return <td className="border pl-4 pr-4 text-black">{renderValueCell()}</td>;
};

export default EditCell;
