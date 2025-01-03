import React from "react";

import { FAILED_LOAD, LOADED, LOADING } from "../../lib/features/statusSlice";
import { useAppSelector } from "../../lib/hooks";
import Loader from "../common/Loader";

const LoadingText = () => {
  const loadingStatus = useAppSelector((state) => state.status.loadingStatus);
  const loadingText = useAppSelector((state) => state.status.loadingText);

  if (loadingStatus === LOADED) {
    return;
  }

  if (loadingStatus === LOADING) {
    return <Loader loadingText={loadingText} />;
  }

  if (loadingStatus === FAILED_LOAD) {
    return (
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2">
        <p className="text-nowrap text-3xl text-red-500">{loadingText}</p>
      </div>
    );
  }
};

export default LoadingText;
