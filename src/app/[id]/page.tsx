import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import buildings from "../../../public/cmumaps-data/buildings.json";
import MainLayout from "../../components/layouts/MainLayout";
import {
  FULL_FLOOR,
  INVALID_BUILDING_CODE,
  INVALID_FLOOR_LEVEL,
  NO_DEFAULT_FLOOR,
  UNAUTHORIZED,
  UNKNOWN,
} from "../../hooks/errorCodes";
import { AWS_API_INVOKE_URL } from "../../lib/apiRoutes";
import { extractBuildingCode, extractFloorLevel } from "../api/apiUtils";

const MAX_USERS_PER_FLOOR = 7;

/**
 * A server component serving as the entry point to the floor plan editing page.
 *
 * - Responsible for:
 *   - Validating that the params refers to a valid floor and redirect if needed
 *   - Preventing more than MAX_USERS_PER_FLOOR number of users on the floor
 */
const Page = async ({ params }: { params: { id: string } }) => {
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

  // Prevent too many users on a floor
  const { getToken } = await auth();
  const token = await getToken();
  const response = await fetch(
    `${AWS_API_INVOKE_URL}/get-user-count?floorCode=${floorCode}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.status === 401) {
    redirect(`/?error=${UNAUTHORIZED}`);
  }

  const body = await response.json();
  if (body.userCount === undefined) {
    redirect(`/?error=${UNKNOWN}`);
  }

  if (body.userCount >= MAX_USERS_PER_FLOOR) {
    redirect(`/?error=${FULL_FLOOR}`);
  }

  return <MainLayout params={params} />;
};

export default Page;
