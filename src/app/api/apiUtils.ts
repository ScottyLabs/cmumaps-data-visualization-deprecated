import { Room } from "@prisma/client";
import path from "path";

/**
 * Get room id as a string from a Prisma Room DB object
 *
 * @param room
 * @returns
 */
export const getRoomId = (room: Room) => {
  return `${room.buildingCode}-${room.name}`;
};

/**
 * Extract the building code associated with the floor code.
 *
 * @param floorCode (e.g: GHC-4)
 * @returns The building code associated with the floor code (e.g: GHC)
 */
export const extractBuildingCode = (floorCode: string) => {
  return floorCode.split("-")[0];
};

/**
 * Extract the floor level associated with the floor code.
 *
 * @param floorCode (e.g: GHC-4)
 * @returns The floor level associated with the floor code (e.g: 4)
 */
export const extractFloorLevel = (floorCode: string) => {
  return floorCode.split("-")[1];
};

export const getTopJSONDirPath = () => {
  return path.join(process.cwd(), "public", "cmumaps-data/floor_plan");
};

export const getJSONDirPath = (buildingCode) => {
  return path.join(
    process.cwd(),
    "public",
    "cmumaps-data/floor_plan",
    buildingCode
  );
};

export const getJsonFilePath = (floorCode) => {
  return path.join(
    process.cwd(),
    "public",
    "cmumaps-data/floor_plan",
    extractBuildingCode(floorCode),
    floorCode + "-outline.json"
  );
};

export const getOutlineJsonFilePath = (floorCode) => {
  return path.join(
    process.cwd(),
    "public",
    "cmumaps-data/floor_plan",
    extractBuildingCode(floorCode),
    floorCode + "-outline.json"
  );
};

export const getGraphJsonFilePath = (floorCode) => {
  return path.join(
    process.cwd(),
    "public",
    "cmumaps-data/floor_plan",
    extractBuildingCode(floorCode),
    floorCode + "-graph.json"
  );
};

export const getPDFDirPath = () => {
  return path.join(process.cwd(), "public", "pdf");
};
