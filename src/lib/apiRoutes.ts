import { buildingCodeToName } from "../components/shared/buildings";

export const AWS_API_INVOKE_URL = `${process.env.NEXT_PUBLIC_AWS_API_INVOKE_URL}/${process.env.NODE_ENV}`;

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
