import { toast } from "react-toastify";

import { buildingCodeToName } from "../components/shared/buildings";

export const AWS_API_INVOKE_URL = `${process.env.NEXT_PUBLIC_AWS_API_INVOKE_URL}/${process.env.NODE_ENV}`;

/**
 * POST `apiPath` with `body`.
 * - Used for api calls that only care if the "saving" action succeeded.
 * - Responsible for error handling.
 *
 * @param apiPath The POST api path
 * @param body The request's body
 * @returns Whether or not the request succeeded
 */
export const savingHelper = async (
  apiPath: string,
  body: BodyInit
): Promise<boolean> => {
  const response = await fetch(apiPath, { method: "POST", body });

  if (!response.ok) {
    const body = await response.json();
    console.error(body.error);
    if (body.errorMessage) {
      toast.error(body.errorMessage);
    } else {
      toast.error("Check the Console for detailed error!");
    }
  }

  return response.ok;
};

/**
 * Calls `/api/getBuildingCodes` with error handling.
 *
 * @remarks Building is excluded if it doesn't have a corresponding entry in
 * {@link buildingCodeToName}.
 *
 * @returns The building codes sorted by their building name (not building code)
 */
export const getBuildingCodes = async (): Promise<string[] | null> => {
  try {
    const response = await fetch("/api/getBuildingCodes", {
      method: "GET",
    });

    const body = await response.json();
    if (!response.ok) {
      console.error(body.error);
      return null;
    }

    let buildingCodes: string[] = body.result;

    // exclude if building doesn't have a corresponding name entry
    buildingCodes = buildingCodes.filter(
      (buildingCode) => buildingCodeToName[buildingCode]
    );

    // sort base on the building name, not building code
    return buildingCodes.sort((a, b) => {
      const nameA = buildingCodeToName[a].toLowerCase();
      const nameB = buildingCodeToName[b].toLowerCase();
      return nameA.localeCompare(nameB);
    });
  } catch (e) {
    console.error("Check the Network tab for more details:", e);
    return null;
  }
};

export const relinkDoorsAndRooms = async (floorCode: string) => {
  try {
    const result = await fetch("/api/relinkRoomsAndDoors", {
      method: "POST",
      body: JSON.stringify({
        floorCode: floorCode,
      }),
    });

    const body = await result.json();
    if (!result.ok) {
      console.error(body.error);
      return null;
    } else {
      return body;
    }
  } catch (e) {
    console.error("Check the Network tab for more details:", e);
    return null;
  }
};
