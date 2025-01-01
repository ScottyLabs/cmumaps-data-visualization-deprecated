import React, { useContext, useEffect, useState } from "react";
import { FaCheck, FaPencilAlt } from "react-icons/fa";
import { ShortcutsStatusContext } from "../contexts/ShortcutsStatusProvider";

interface Props {
  property: string;
  value: string | undefined;
  handleSave;
}

const EditCell = ({ property, value, handleSave }: Props) => {
  const { setShortcutsDisabled } = useContext(ShortcutsStatusContext);

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
        <div className="flex">
          <input
            id={property}
            className="box-border h-7 w-20 rounded border border-gray-300 px-2 py-0.5"
            type="text"
            value={editedValue}
            onChange={(e) => setEditedValue(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSave(editedValue, setEditedValue, setIsEditing);
                setShortcutsDisabled(false);
              }
            }}
            onBlur={() => {
              setEditedValue(value);
              setShortcutsDisabled(false);
              setIsEditing(false);
            }}
            autoFocus
          />
          <FaCheck
            className="ml-2 cursor-pointer text-2xl text-white hover:text-gray-400"
            onMouseDown={() => {
              handleSave(editedValue, setEditedValue, setIsEditing);
              setShortcutsDisabled(false);
            }}
          />
        </div>
      );
    } else {
      return (
        <div className="flex justify-between">
          <div className="h-7 text-lg text-white">{value}</div>
          <FaPencilAlt
            className="ml-2 mt-1 cursor-pointer text-right text-white hover:text-gray-400"
            onClick={() => {
              setIsEditing(true);
              setShortcutsDisabled(true);
            }}
          />
        </div>
      );
    }
  };

  return <td className="border pl-4 pr-4 text-black">{renderValueCell()}</td>;
};

export default EditCell;
