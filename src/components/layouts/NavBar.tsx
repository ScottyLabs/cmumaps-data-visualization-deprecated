import { useRouter } from "next/navigation";

import React from "react";

import { SAVED } from "../../lib/features/statusSlice";
import { useAppSelector } from "../../lib/hooks";
import { buildingCodeToName } from "../shared/buildings";

interface Props {
  buildingCode: string;
}

const NavBar = ({ buildingCode }: Props) => {
  const router = useRouter();
  const saveStatus = useAppSelector((state) => state.status.saveStatus);

  const handleBackClick = () => {
    if (saveStatus === SAVED) {
      router.push("/");
    }

    // ask for confirmation if not saved
    const message = "You have unsaved changes. Are you sure you want to leave?";
    if (window.confirm(message)) {
      router.push("/");
    }
  };

  return (
    <nav className="bg-gray-800 p-4">
      <div className="flex justify-between">
        <div className="text-xl font-bold text-white">
          CMU Maps Data Visualization
        </div>
        <div className="h-7 -translate-x-1/2 text-xl text-white">
          {buildingCodeToName[buildingCode]}
        </div>
        <button
          onClick={handleBackClick}
          className="mr-2 cursor-pointer text-lg text-white hover:text-gray-400"
        >
          Back
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
