import dynamic from "next/dynamic";

import { useEffect } from "react";
import { useState } from "react";

import Loader from "../../components/common/Loader";
import FloorLevelsProvider from "../../components/contexts/FloorLevelsProvider";
import {
  DefaultIdSelected,
  IdSelectedInfo,
} from "../../components/contexts/IdEventsTypes";
import LoadingProvider from "../../components/contexts/LoadingProvider";
import ModeProvider, {
  GRAPH_SELECT,
  Mode,
} from "../../components/contexts/ModeProvider";
import SaveStatusProvider from "../../components/contexts/SaveStatusProvider";
import { SaveStatus, SAVED } from "../../components/contexts/SaveStatusType";
import FloorSwitcher from "../../components/layouts/FloorSwitcher";
import MainDisplay from "../../components/layouts/MainDisplay";
import NavBar from "../../components/layouts/NavBar";
import MyToastContainer from "../../components/shared/MyToastContainer";
import HelpInfo from "../../components/zoom-pan/HelpInfo";
import { LIVEBLOCKS_ENABLED } from "../../settings";

const UserCount = dynamic(() => import("../../components/layouts/UserCount"), {
  ssr: false,
});

interface Props {
  buildingCode: string;
  floorLevel: string;
  floorLevels: string[];
}

const MainLayout = ({ buildingCode, floorLevel, floorLevels }: Props) => {
  const [idSelected, setIdSelected] =
    useState<IdSelectedInfo>(DefaultIdSelected);

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

  const [mode, setMode] = useState<Mode>(GRAPH_SELECT);
  // reset mode when switch floor
  useEffect(() => {
    setMode(GRAPH_SELECT);
  }, [floorLevel]);

  const renderResetModeButtton = () => {
    return (
      <button
        className="fixed bottom-10 m-1 rounded border border-black p-1 hover:bg-gray-200"
        onClick={() => setMode(GRAPH_SELECT)}
      >
        Reset Mode
      </button>
    );
  };

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
                <ModeProvider modeData={{ mode, setMode }}>
                  <MainDisplay
                    floorCode={buildingCode + "-" + floorLevel}
                    saveStatus={saveStatus}
                    idSelected={idSelected}
                    setIdSelected={setIdSelected}
                  />
                </ModeProvider>
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

          {renderResetModeButtton()}
          <div className="fixed bottom-0 m-2">Mode: {mode}</div>
        </>
      )}

      <MyToastContainer />
    </div>
  );
};

export default MainLayout;
