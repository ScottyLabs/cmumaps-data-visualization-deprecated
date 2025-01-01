import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { FaArrowUp } from "react-icons/fa";
import { FaArrowDown } from "react-icons/fa";

interface Props {
  buildingCode: string;
  floorLevels: string[];
  floorLevelSelected: string;
}

const FloorSwitcher = ({
  buildingCode,
  floorLevels,
  floorLevelSelected,
}: Props) => {
  const router = useRouter();
  const [fullDisplayMode, setFullDisplayMode] = useState<boolean>(false);

  const renderFullDisplayMode = () =>
    floorLevels.map((floorLevel) => (
      <td
        key={floorLevel}
        className={
          "cursor-pointer border border-black px-2 " +
          (floorLevel == floorLevelSelected ? "font-bold" : "")
        }
        onClick={() => {
          router.push(`${buildingCode}-${floorLevel}`);
          setFullDisplayMode(false);
        }}
      >
        {floorLevel}
      </td>
    ));

  const renderNotFullDisplayMode = () => {
    const index = floorLevels.indexOf(floorLevelSelected);

    const handleDownClick = () => {
      if (index != 0) {
        router.push(`${buildingCode}-${floorLevels[index - 1]}`);
      }
    };

    const renderDownArrow = () => (
      <td className="flex items-center border-x border-black p-1">
        <FaArrowDown
          className={
            index == 0 ? "cursor-pointer text-gray-400" : "cursor-pointer"
          }
          onClick={handleDownClick}
        />
      </td>
    );

    const renderFloorLevelCell = () => (
      <td
        className="cursor-pointer text-lg"
        onClick={() => setFullDisplayMode(true)}
      >
        <div className="px-2 text-center">{floorLevelSelected}</div>
        <div className="flex justify-center">
          {floorLevels.map((floorLevel) => (
            <div
              key={floorLevel}
              className={
                "m-[1px] h-1 w-1 rounded-full " +
                (floorLevel == floorLevelSelected ? "bg-black" : "bg-gray-400")
              }
            ></div>
          ))}
        </div>
      </td>
    );

    const handleUpClick = () => {
      if (index != floorLevels.length - 1) {
        router.push(`${buildingCode}-${floorLevels[index + 1]}`);
      }
    };

    const renderUpArrow = () => (
      <td className="flex items-center border-l border-black p-1">
        <FaArrowUp
          className={
            index == floorLevels.length - 1 ? "text-gray-400" : "cursor-pointer"
          }
          onClick={handleUpClick}
        />
      </td>
    );

    return (
      <>
        <td className="border-black p-1">
          <p className="m-0 px-1">Floor Switcher:</p>
        </td>
        {renderDownArrow()}
        {renderFloorLevelCell()}
        {renderUpArrow()}
      </>
    );
  };

  return (
    <div className="rounded border border-black bg-gray-50">
      <table>
        <tbody className="flex">
          <tr className="flex">
            {fullDisplayMode
              ? renderFullDisplayMode()
              : renderNotFullDisplayMode()}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default FloorSwitcher;
