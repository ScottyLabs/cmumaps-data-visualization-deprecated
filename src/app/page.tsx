"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

import React, { useEffect, useState } from "react";
import { CiSquarePlus } from "react-icons/ci";
import { toast } from "react-toastify";

import MyToastContainer from "../components/shared/MyToastContainer";
import { buildingCodeToName } from "../components/shared/buildings";
import useWebSocket from "../hooks/useWebSocket";
import { getBuildingCodes } from "../lib/apiRoutes";

const App: React.FC = () => {
  const [buildingCodes, setBuildingCodes] = useState<string[]>([]);

  // join WebSocket
  useWebSocket(null);

  // fetch building codes
  useEffect(() => {
    getBuildingCodes().then((buildingCodes) => {
      if (buildingCodes) {
        setBuildingCodes(buildingCodes);
      } else {
        toast.error(
          "Fetching building codes failed! Check the Console for detailed error!",
          { autoClose: false }
        );
      }
    });
  }, []);

  // Toast the error message based on session storage
  useEffect(() => {
    // make sure on client side
    if (
      typeof window === "undefined" ||
      typeof sessionStorage === "undefined"
    ) {
      return;
    }

    const error = sessionStorage.getItem("error");
    switch (error) {
      case "InvalidBuildingCode":
        toast.error("The building code is invalid!");
        break;

      case "NoDefaultFloor":
        toast.error("Please add a default floor for this building!");
        break;
    }

    // clear storage so it is not toasted again when refreshed
    sessionStorage.setItem("error", "");
  }, []);

  const renderTopBar = () => (
    <div className="m-2 flex justify-between">
      <Link href={"PDFUpload"}>
        <CiSquarePlus
          className="text-2xl text-blue-500 hover:text-blue-700"
          size={40}
        />
      </Link>
      <div>
        <UserButton />
      </div>
    </div>
  );

  const renderBuildingLinks = () => (
    <div className="m-5 flex flex-wrap gap-8">
      {buildingCodes.map((buildingCode) => (
        <Link
          href={buildingCode}
          key={buildingCode}
          className="cursor-pointer rounded-lg border border-gray-300 p-4 shadow-md transition duration-200 ease-in-out hover:scale-105 hover:shadow-lg"
        >
          {buildingCodeToName[buildingCode]}
        </Link>
      ))}
    </div>
  );

  return (
    <div>
      {renderTopBar()}
      {renderBuildingLinks()}
      <MyToastContainer />
    </div>
  );
};

export default App;
