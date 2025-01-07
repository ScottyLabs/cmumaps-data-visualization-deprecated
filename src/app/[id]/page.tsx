// import { skipToken } from "@reduxjs/toolkit/query";
import { redirect } from "next/navigation";

import buildings from "../../../public/cmumaps-data/buildings.json";
import MainLayout from "../../components/layouts/MainLayout";
import {
  // FULL_FLOOR,
  INVALID_BUILDING_CODE,
  INVALID_FLOOR_LEVEL,
  NO_DEFAULT_FLOOR,
} from "../../components/shared/types";
// import useClerkToken from "../../hooks/useClerkToken";
// import { useGetUserCountQuery } from "../../lib/features/apiSlice";
// import { setFloorLevels } from "../../lib/features/floorSlice";
// import { GRAPH_SELECT, setMode } from "../../lib/features/modeSlice";
// import { useAppDispatch } from "../../lib/hooks";
// import { WEBSOCKET_ENABLED } from "../../settings";
import { extractBuildingCode, extractFloorLevel } from "../api/apiUtils";

// const MAX_USERS_PER_FLOOR = 7;

/**
 * A server component serving as the entry point to the floor plan editting page.
 *
 * - Responsible for:
 *   - Validating that the params refers to a valid floor and redirect if needed
 *   - Checking the floor is not full
 */
const Page = ({ params }: { params: { id: string } }) => {
  // get floor info
  const floorCode = params.id;
  const buildingCode = extractBuildingCode(floorCode);
  const floorLevel = extractFloorLevel(floorCode);

  // Validate floor level and redirect if invalid
  if (!buildings[buildingCode]) {
    redirect(`/?error=${INVALID_BUILDING_CODE}`);
  }

  if (!buildings[buildingCode].defaultFloor) {
    redirect(`/error=${NO_DEFAULT_FLOOR}`);
  }

  const defaultFloorUrl =
    buildingCode + "-" + buildings[buildingCode].defaultFloor;

  // go to the default floor of the building if the floor is unspecified in the url
  if (!floorLevel) {
    redirect(defaultFloorUrl);
  }

  // handle invalid floor level
  if (!buildings[buildingCode].floors.includes(floorLevel)) {
    redirect(defaultFloorUrl + `?error=${INVALID_FLOOR_LEVEL}`);
  }

  // // Prevent too many users on a floor
  // const { data: userCount } = useGetUserCountQuery(
  //   token ? { floorCode, token } : skipToken
  // );
  // if (userCount && userCount >= MAX_USERS_PER_FLOOR) {
  //   if (typeof window === "undefined") {
  //     return;
  //   }
  //   sessionStorage.setItem("error", FULL_FLOOR);
  //   redirect("/");
  // }

  return <MainLayout params={params} />;
};

export default Page;
