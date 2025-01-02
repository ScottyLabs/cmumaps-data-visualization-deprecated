import { useRouter } from "next/navigation";

import React from "react";

import { useAppSelector } from "../../lib/hooks";
import { buildingCodeToName } from "../shared/buildings";
import { leavePage } from "../utils/routerUtils";

interface Props {
  buildingCode: string;
}

const NavBar = ({ buildingCode }: Props) => {
  const router = useRouter();
  const saveStatus = useAppSelector((state) => state.status.saveStatus);

  return (
    <nav className="absolute inset-0 z-50 h-min bg-gray-800 p-4">
      <div className="flex justify-between">
        <div className="text-xl font-bold text-white">
          CMU Maps Data Visualization
        </div>
        <div className="h-7 -translate-x-1/2 text-xl text-white">
          {buildingCodeToName[buildingCode]}
        </div>
        <button
          onClick={() => leavePage("/", saveStatus, router)}
          className="mr-2 cursor-pointer text-lg text-white hover:text-gray-400"
        >
          Back
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
