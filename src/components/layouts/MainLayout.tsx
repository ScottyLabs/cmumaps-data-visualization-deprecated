import dynamic from "next/dynamic";

import { useEffect } from "react";
import { useState } from "react";

import Loader from "../../components/common/Loader";
import FloorLevelsProvider from "../../components/contexts/FloorLevelsProvider";
import LoadingProvider from "../../components/contexts/LoadingProvider";
import SaveStatusProvider from "../../components/contexts/SaveStatusProvider";
import { SaveStatus, SAVED } from "../../components/contexts/SaveStatusType";
import FloorSwitcher from "../../components/layouts/FloorSwitcher";
import MainDisplay from "../../components/layouts/MainDisplay";
import NavBar from "../../components/layouts/NavBar";
import MyToastContainer from "../../components/shared/MyToastContainer";
import HelpInfo from "../../components/zoom-pan/HelpInfo";
import { GRAPH_SELECT, setMode } from "../../lib/features/modeSlice";
import { useAppDispatch } from "../../lib/hooks";
import { LIVEBLOCKS_ENABLED } from "../../settings";
import ModeDisplay from "./ModeDisplay";

const UserCount = dynamic(() => import("../../components/layouts/UserCount"), {
  ssr: false,
});

interface Props {
  buildingCode: string;
  floorLevel: string;
  floorLevels: string[];
}

const MainLayout = ({ buildingCode, floorLevel, floorLevels }: Props) => {
  const dispatch = useAppDispatch();

  const [loadingText, setLoadingText] = useState<string>("Loading");
  const [loadingFailed, setLoadingFailed] = useState<boolean>(false);

  const loadingData = {
    loadingText,
    setLoadingText,
    setLoadingFailed,
  };

  const [saveStatus, setSaveStatus] = useState<SaveStatus>(SAVED);
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

  const renderLoadingText = () => {
    if (loadingText) {
      if (loadingFailed) {
        return (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2">
            <p className="text-nowrap text-3xl text-red-500">{loadingText}</p>
          </div>
        );
      } else {
        return <Loader loadingText={loadingText} />;
      }
    }
  };

  return (
    <div>
      <div className="absolute inset-0 z-50 h-min">
        <NavBar buildingCode={buildingCode} />
      </div>

      {floorLevel && (
        <>
          {renderLoadingText()}

          <FloorLevelsProvider floorLevels={floorLevels}>
            <LoadingProvider loadingData={loadingData}>
              <SaveStatusProvider setSaveStatus={setSaveStatus}>
                <MainDisplay
                  floorCode={buildingCode + "-" + floorLevel}
                  saveStatus={saveStatus}
                />
              </SaveStatusProvider>
            </LoadingProvider>
          </FloorLevelsProvider>

          {!loadingText && (
            <div className="fixed bottom-2 left-1/2 z-50 -translate-x-1/2">
              <FloorSwitcher
                buildingCode={buildingCode}
                floorLevels={floorLevels}
                floorLevelSelected={floorLevel}
              />
            </div>
          )}

          <HelpInfo />

          {LIVEBLOCKS_ENABLED && <UserCount />}

          <ModeDisplay />
        </>
      )}

      <MyToastContainer />
    </div>
  );
};

export default MainLayout;
