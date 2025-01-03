"use client";

import { redirect, useRouter } from "next/navigation";

import { useEffect } from "react";
import { toast } from "react-toastify";

import buildings from "../../../public/cmumaps-data/buildings.json";
import Loader from "../../components/common/Loader";
import FloorSwitcher from "../../components/layouts/FloorSwitcher";
import LiveblocksWrapper from "../../components/layouts/LiveblocksWrapper";
import MainDisplay from "../../components/layouts/MainDisplay";
import ModeDisplay from "../../components/layouts/ModeDisplay";
import NavBar from "../../components/layouts/NavBar";
import UserCount from "../../components/layouts/UserCount";
import MyToastContainer from "../../components/shared/MyToastContainer";
import HelpInfo from "../../components/zoom-pan/HelpInfo";
import { setFloorLevels } from "../../lib/features/dataSlice";
import {
  ADD_DOOR_NODE,
  ADD_EDGE,
  ADD_NODE,
  DELETE_EDGE,
  GRAPH_SELECT,
  POLYGON_ADD_VERTEX,
  POLYGON_DELETE_VERTEX,
  setMode,
} from "../../lib/features/modeSlice";
import { FAILED_LOAD, LOADED, SAVED } from "../../lib/features/statusSlice";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import { LIVEBLOCKS_ENABLED } from "../../settings";
import { extractBuildingCode, extractFloorLevel } from "../api/apiUtils";

/**
 * Entry point to the floor plan editting page.
 *
 * - Responsible for:
 *   - Validating that the params refers to a valid floor and redirect if needed
 *   - Displaying the loading screen when loading
 *   - Toasting error message based on session storage
 *   - Displaying warning before closing tab if needed using saveStatus
 *   - Resetting mode when switching floor and toasting when mode changes
 */
const Page = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const mode = useAppSelector((state) => state.mode.mode);
  const saveStatus = useAppSelector((state) => state.status.saveStatus);
  const loadingStatus = useAppSelector((state) => state.status.loadingStatus);
  const loadingText = useAppSelector((state) => state.status.loadingText);

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

  // Warn before closing tab
  useEffect(() => {
    const handleWindowClose = (e) => {
      if (saveStatus !== SAVED) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleWindowClose);
    return () => {
      window.removeEventListener("beforeunload", handleWindowClose);
    };
  }, [saveStatus]);

  // Reset mode when switching floor
  useEffect(() => {
    dispatch(setMode(GRAPH_SELECT));
  }, [dispatch, floorLevel]);

  // Toast when mode changes
  useEffect(() => {
    switch (mode) {
      case ADD_EDGE:
        toast.info("Click on another node to add an edge!");
        break;

      case DELETE_EDGE:
        toast.info("Click on another node to delete an edge!");
        break;

      case ADD_NODE:
        toast.info("Click to add a node!");
        break;

      case ADD_DOOR_NODE:
        toast.info("Click on a purple door to add a door node!");
        break;

      case POLYGON_DELETE_VERTEX:
        toast.info("Click on vertex to delete it!");
        break;

      case POLYGON_ADD_VERTEX:
        toast.info("Click to add a vertex!");
        break;
    }
  }, [mode]);

  //#region Validate floor level and redirect if invalid
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
  //#endregion

  const renderLoadingText = () => {
    if (loadingStatus === FAILED_LOAD) {
      return (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2">
          <p className="text-nowrap text-3xl text-red-500">{loadingText}</p>
        </div>
      );
    } else {
      return <Loader loadingText={loadingText} />;
    }
  };

  return (
    <LiveblocksWrapper floorCode={floorCode}>
      <NavBar buildingCode={buildingCode} />
      {LIVEBLOCKS_ENABLED && <UserCount />}
      {loadingStatus !== LOADED && renderLoadingText()}
      <MainDisplay floorCode={floorCode} />
      <ModeDisplay />
      <FloorSwitcher
        buildingCode={buildingCode}
        floorLevelSelected={floorLevel}
      />
      <HelpInfo />
      <MyToastContainer />
    </LiveblocksWrapper>
  );
};

export default Page;
