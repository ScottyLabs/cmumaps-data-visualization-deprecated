import React, { KeyboardEventHandler } from "react";
import { toast } from "react-toastify";

import { setShortcutsDisabled } from "../../../lib/features/statusSlice";
import { useAppDispatch } from "../../../lib/hooks";
import { RoomInfo } from "../../shared/types";

interface Props {
  room: RoomInfo;
  handleSaveHelper: (newRoomInfo: RoomInfo) => void;
}

const AliasesMultiSelect = ({ room, handleSaveHelper }: Props) => {
  const dispatch = useAppDispatch();

  const saveAliasesHelper = (newAliases) => {
    const newRoomInfo = { ...room, aliases: newAliases };
    handleSaveHelper(newRoomInfo);
  };

  const [inputValue, setInputValue] = React.useState("");

  const addAlias = () => {
    const newAliases = [...room.aliases, inputValue];
    saveAliasesHelper(newAliases);
    setInputValue("");
  };

  const deleteAlias = (index: number) => () => {
    const newAliases = room.aliases.filter((_, i) => i !== index);
    saveAliasesHelper(newAliases);
  };

  const handleKeyDown: KeyboardEventHandler = (event) => {
    if (!inputValue) {
      return;
    }

    switch (event.key) {
      case "Enter":
        if (room.aliases.some((alias) => alias === inputValue)) {
          toast.error("Don't add duplicated aliases!");
          return;
        }
        addAlias();
        event.preventDefault();
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex w-full gap-1">
        <input
          className="w-full flex-1 rounded p-1"
          placeholder="Enter new alias..."
          value={inputValue}
          onChange={(newValue) => setInputValue(newValue.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => dispatch(setShortcutsDisabled(true))}
          onBlur={() => dispatch(setShortcutsDisabled(false))}
        />
        <button className="w-8 rounded bg-white p-1" onClick={addAlias}>
          +
        </button>
      </div>
      {room.aliases.map((alias, index) => {
        return (
          <div key={index} className="flex w-full gap-1">
            <div className="flex-1 overflow-hidden rounded bg-gray-200 p-1">
              <p>{alias}</p>
            </div>
            <button
              className="w-8 rounded bg-white p-1"
              onClick={deleteAlias(index)}
            >
              -
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default AliasesMultiSelect;
