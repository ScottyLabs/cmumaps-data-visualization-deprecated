"use client";

import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import buildings from "../../../public/cmumaps-data/buildings.json";
import LiveblocksWrapper from "../../components/layouts/LiveblocksWrapper";
import MainLayout from "../../components/layouts/MainLayout";
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

  const [validated, setValidated] = useState<boolean>(false);

  // get floor info
  const floorCode = params.id;
  const buildingCode = extractBuildingCode(floorCode);
  const floorLevel = extractFloorLevel(floorCode);

  // get floor levels
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

    setValidated(true);
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

  if (!validated) {
    return;
  }

  return (
    <LiveblocksWrapper floorCode={floorCode}>
      <MainLayout
        buildingCode={buildingCode}
        floorLevel={floorLevel}
        floorLevels={buildings[buildingCode].floors}
      />
    </LiveblocksWrapper>
  );
};

export default Page;
