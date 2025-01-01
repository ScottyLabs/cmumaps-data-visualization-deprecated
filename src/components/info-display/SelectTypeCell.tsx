import React, { useContext, useState } from "react";
import Select from "react-select";
import { ShortcutsStatusContext } from "../contexts/ShortcutsStatusProvider";
import { selectStyle } from "../shared/selectStyle";
interface Props {
  defaultType: string | undefined;
  typeList: string[];
  handleChange;
}

const EditTypeRow = ({ handleChange, typeList, defaultType }: Props) => {
  const { setShortcutsDisabled } = useContext(ShortcutsStatusContext);

  const options = typeList.map((type) => ({
    value: type,
    label: type,
  }));

  const [selectedOption, setSelectedOption] = useState({
    value: defaultType,
    label: defaultType,
  });

  const [valueColor, setValueColor] = useState("black");

  return (
    <td className="border p-2 text-black">
      <Select
        value={selectedOption}
        onChange={handleChange(setSelectedOption)}
        options={options}
        onFocus={() => {
          setShortcutsDisabled(true);
          setValueColor("gray");
        }}
        onBlur={() => {
          setShortcutsDisabled(false);
          setValueColor("black");
        }}
        blurInputOnSelect
        styles={{
          ...selectStyle,
          singleValue: (provided) => ({
            ...provided,
            color: valueColor,
          }),
        }}
        className="text-left"
      />
    </td>
  );
};

export default EditTypeRow;
