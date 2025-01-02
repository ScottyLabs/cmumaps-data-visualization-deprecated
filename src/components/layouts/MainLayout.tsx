import dynamic from "next/dynamic";

import { useEffect } from "react";
import { toast } from "react-toastify";

import { extractBuildingCode, extractFloorLevel } from "../../app/api/apiUtils";
import Loader from "../../components/common/Loader";
import FloorSwitcher from "../../components/layouts/FloorSwitcher";
import MainDisplay from "../../components/layouts/MainDisplay";
import NavBar from "../../components/layouts/NavBar";
import MyToastContainer from "../../components/shared/MyToastContainer";
import HelpInfo from "../../components/zoom-pan/HelpInfo";
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
import ModeDisplay from "./ModeDisplay";

const UserCount = dynamic(() => import("../../components/layouts/UserCount"), {
  ssr: false,
});

interface Props {
  floorCode: string;
}

/**
 * Layout for the floor editing page.
 *
 * - Responsible for:
 *   - loading display
 *   - mode related handling
 */
const MainLayout = ({ floorCode }: Props) => {
  const dispatch = useAppDispatch();

  const buildingCode = extractBuildingCode(floorCode);
  const floorLevel = extractFloorLevel(floorCode);

  const mode = useAppSelector((state) => state.mode.mode);
  const saveStatus = useAppSelector((state) => state.status.saveStatus);
  const loadingStatus = useAppSelector((state) => state.status.loadingStatus);
  const loadingText = useAppSelector((state) => state.status.loadingText);

  // warning before closing tab
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

  // reset mode when switch floor
  useEffect(() => {
    dispatch(setMode(GRAPH_SELECT));
  }, [dispatch, floorLevel]);

  // toast when mode changes
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
    <div>
      <NavBar buildingCode={buildingCode} />
      <MainDisplay floorCode={floorCode} />
      <FloorSwitcher
        buildingCode={buildingCode}
        floorLevelSelected={floorLevel}
      />
      <ModeDisplay />
      <HelpInfo />
      {LIVEBLOCKS_ENABLED && <UserCount />}
      {loadingStatus !== LOADED && renderLoadingText()}
      <MyToastContainer />
    </div>
  );
};

export default MainLayout;
