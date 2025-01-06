"use client";

import { redirect, useRouter } from "next/navigation";

import { useEffect } from "react";
import { toast } from "react-toastify";

import buildings from "../../../public/cmumaps-data/buildings.json";
import FloorSwitcher from "../../components/layouts/FloorSwitcher";
import LoadingText from "../../components/layouts/LoadingText";
import MainDisplay from "../../components/layouts/MainDisplay";
import ModeDisplay from "../../components/layouts/ModeDisplay";
import NavBar from "../../components/layouts/NavBar";
import UserCount from "../../components/layouts/UserCount";
import MyToastContainer from "../../components/shared/MyToastContainer";
import HelpInfo from "../../components/zoom-pan/HelpInfo";
import { setFloorLevels } from "../../lib/features/floorSlice";
import { GRAPH_SELECT, setMode } from "../../lib/features/modeSlice";
import { useAppDispatch } from "../../lib/hooks";
import { WEBSOCKET_ENABLED } from "../../settings";
import { extractBuildingCode, extractFloorLevel } from "../api/apiUtils";

/**
 * Entry point to the floor plan editting page.
 *
 * - Responsible for:
 *   - Validating that the params refers to a valid floor and redirect if needed
 *   - Toasting error message based on session storage
 *   - Displaying warning before closing tab if needed using saveStatus
 *   - Resetting mode when switching floor and toasting when mode changes
 */
const Page = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // get floor info
  const floorCode = params.id;
  const buildingCode = extractBuildingCode(floorCode);
  const floorLevel = extractFloorLevel(floorCode);

  // Get floor levels
  useEffect(() => {
    dispatch(setFloorLevels(buildings[buildingCode].floors));
  }, [buildingCode, dispatch, floorLevel, router]);

  // Toast the error message based on session storage
  useEffect(() => {
    // make sure on client side
    if (typeof window === "undefined") {
      return;
    }

    const error = sessionStorage.getItem("error");
    switch (error) {
      case "InvalidFloorLevel":
        toast.error("The floor level is invalid!");
        break;
    }

    // clear storage so it is not toasted again when refreshed
    sessionStorage.setItem("error", "");
  }, []);

  // Reset mode when switching floor
  useEffect(() => {
    dispatch(setMode(GRAPH_SELECT));
  }, [dispatch, floorCode]);

  // Validate floor level and redirect if invalid
  (() => {
    if (!buildings[buildingCode]) {
      sessionStorage.setItem("error", "InvalidBuildingCode");
      redirect("/");
    }

    if (!buildings[buildingCode].defaultFloor) {
      sessionStorage.setItem("error", "NoDefaultFloor");
      redirect("/");
    }

    const defaultFloorUrl =
      buildingCode + "-" + buildings[buildingCode].defaultFloor;

    // go to the default floor of the building if the floor is unspecified in the url
    if (!floorLevel) {
      redirect(defaultFloorUrl);
    }

    // handle invalid floor level
    if (!buildings[buildingCode].floors.includes(floorLevel)) {
      sessionStorage.setItem("error", "InvalidFloorLevel");
      redirect(defaultFloorUrl);
    }
  })();

  return (
    <>
      <NavBar buildingCode={buildingCode} />
      {WEBSOCKET_ENABLED && <UserCount />}
      <LoadingText />
      <MainDisplay floorCode={floorCode} />
      <ModeDisplay />
      <FloorSwitcher
        buildingCode={buildingCode}
        floorLevelSelected={floorLevel}
      />
      <HelpInfo />
      <MyToastContainer />
    </>
  );
};

export default Page;
