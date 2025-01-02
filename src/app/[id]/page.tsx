"use client";

import { useRouter } from "next/navigation";

import { useEffect } from "react";
import { toast } from "react-toastify";

import buildings from "../../../public/cmumaps-data/buildings.json";
import LiveblocksWrapper from "../../components/layouts/LiveblocksWrapper";
import MainLayout from "../../components/layouts/MainLayout";
import { setFloorLevels } from "../../lib/features/dataSlice";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import { extractBuildingCode, extractFloorLevel } from "../api/apiUtils";

/**
 * Entry point to the floor plan editting page.
 *
 * - Responsible for:
 *   - validating that the params referes to a valid floor
 *   - toasting error message based on session storage
 */
const Page = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const floorLevels = useAppSelector((state) => state.data.floorLevels);

  // get floor info
  const floorCode = params.id;
  const buildingCode = extractBuildingCode(floorCode);
  const floorLevel = extractFloorLevel(floorCode);

  // Validate floor level and get floor levels
  useEffect(() => {
    // handle invalid building code
    if (!buildings[buildingCode]) {
      sessionStorage.setItem("error", "InvalidBuildingCode");
      router.push("/");
      return;
    }

    if (!buildings[buildingCode].defaultFloor) {
      sessionStorage.setItem("error", "NoDefaultFloor");
      router.push("/");
      return;
    }

    const defaultFloorUrl =
      buildingCode + "-" + buildings[buildingCode].defaultFloor;

    // go to the default floor of the building if the floor is unspecified in the url
    if (!floorLevel) {
      router.push(defaultFloorUrl);
      return;
    }

    // handle invalid floor level
    if (!buildings[buildingCode].floors.includes(floorLevel)) {
      sessionStorage.setItem("error", "InvalidFloorLevel");
      router.push(defaultFloorUrl);
      return;
    }

    dispatch(setFloorLevels(buildings[buildingCode].floors));
  }, [buildingCode, floorLevel, router]);

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

  if (!floorLevels) {
    return;
  }

  return (
    <LiveblocksWrapper floorCode={floorCode}>
      <MainLayout floorCode={floorCode} />
    </LiveblocksWrapper>
  );
};

export default Page;
