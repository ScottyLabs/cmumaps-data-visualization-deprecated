"use client";

import { useRouter } from "next/navigation";

import { useEffect } from "react";

import buildings from "../../../public/cmumaps-data/buildings.json";
import { extractBuildingCode, extractFloorLevel } from "../../app/api/apiUtils";
import FloorSwitcher from "../../components/layouts/FloorSwitcher";
import HelpInfo from "../../components/layouts/HelpInfo";
import LoadingText from "../../components/layouts/LoadingText";
import MainDisplay from "../../components/layouts/MainDisplay";
import ModeDisplay from "../../components/layouts/ModeDisplay";
import NavBar from "../../components/layouts/NavBar";
import UserCount from "../../components/layouts/UserCount";
import MyToastContainer from "../../components/shared/MyToastContainer";
import useErrorToast from "../../hooks/useErrorToast";
import { setFloorLevels } from "../../lib/features/floorSlice";
import { GRAPH_SELECT, setMode } from "../../lib/features/modeSlice";
import { useAppDispatch } from "../../lib/hooks";
import { WEBSOCKET_ENABLED } from "../../settings";

/**
 * Main client component for the floor editing page
 *
 * - Responsible for
 *   - Getting floor levels
 *   - Resetting mode when switching floor
 */
const MainLayout = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  useErrorToast(params.id);

  // get floor info
  const floorCode = params.id;
  const buildingCode = extractBuildingCode(floorCode);
  const floorLevel = extractFloorLevel(floorCode);

  // Get floor levels
  useEffect(() => {
    dispatch(setFloorLevels(buildings[buildingCode].floors));
  }, [buildingCode, dispatch, router]);

  // Reset mode when switching floor
  useEffect(() => {
    dispatch(setMode(GRAPH_SELECT));
  }, [dispatch, floorCode]);

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

export default MainLayout;
