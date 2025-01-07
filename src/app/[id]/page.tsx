"use client";

import { skipToken } from "@reduxjs/toolkit/query";
import { redirect, useRouter } from "next/navigation";

import { useEffect } from "react";
import { toast } from "react-toastify";

import buildings from "../../../public/cmumaps-data/buildings.json";
import FloorSwitcher from "../../components/layouts/FloorSwitcher";
import HelpInfo from "../../components/layouts/HelpInfo";
import LoadingText from "../../components/layouts/LoadingText";
import MainDisplay from "../../components/layouts/MainDisplay";
import ModeDisplay from "../../components/layouts/ModeDisplay";
import NavBar from "../../components/layouts/NavBar";
import UserCount from "../../components/layouts/UserCount";
import MyToastContainer from "../../components/shared/MyToastContainer";
import {
  FULL_FLOOR,
  INVALID_BUILDING_CODE,
  INVALID_FLOOR_LEVEL,
  NO_DEFAULT_FLOOR,
} from "../../components/shared/types";
import useClerkToken from "../../hooks/useClerkToken";
import { useGetUserCountQuery } from "../../lib/features/apiSlice";
import { setFloorLevels } from "../../lib/features/floorSlice";
import { GRAPH_SELECT, setMode } from "../../lib/features/modeSlice";
import { setError } from "../../lib/features/statusSlice";
import { useAppDispatch } from "../../lib/hooks";
import { WEBSOCKET_ENABLED } from "../../settings";
import { extractBuildingCode, extractFloorLevel } from "../api/apiUtils";

const MAX_USERS_PER_FLOOR = 7;

/**
 * Entry point to the floor plan editting page.
 *
 * - Responsible for:
 *   - Validating that the params refers to a valid floor and redirect if needed
 *   - Toasting error message based on session storage
 *   - Displaying warning before closing tab if needed using saveStatus
 *   - Resetting mode when switching floor and toasting when mode changes
 *   - Prevent too many users on a floor
 */
const Page = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // get floor info
  const floorCode = params.id;
  const buildingCode = extractBuildingCode(floorCode);
  const floorLevel = extractFloorLevel(floorCode);

  // Get floor levels
  // useEffect(() => {
  //   dispatch(setFloorLevels(buildings[buildingCode].floors));
  // }, [buildingCode, dispatch, floorLevel, router]);

  // Toast the error message based on session storage
  useEffect(() => {
    // make sure on client side
    if (typeof window === "undefined") {
      return;
    }

    const error = sessionStorage.getItem("error");
    switch (error) {
      case INVALID_FLOOR_LEVEL:
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
  useEffect(() => {
    if (!buildings[buildingCode]) {
      sessionStorage.setItem("error", INVALID_BUILDING_CODE);
      dispatch(setError(INVALID_BUILDING_CODE));
      redirect("/");
    }

    if (!buildings[buildingCode].defaultFloor) {
      sessionStorage.setItem("error", NO_DEFAULT_FLOOR);
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
      sessionStorage.setItem("error", INVALID_FLOOR_LEVEL);
      redirect(defaultFloorUrl);
    }
  }, []);

  // Prevent too many users on a floor
  const token = useClerkToken();
  const { data: userCount } = useGetUserCountQuery(
    token ? { floorCode, token } : skipToken
  );
  if (userCount && userCount >= MAX_USERS_PER_FLOOR) {
    if (typeof window === "undefined") {
      return;
    }
    sessionStorage.setItem("error", FULL_FLOOR);
    redirect("/");
  }

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
