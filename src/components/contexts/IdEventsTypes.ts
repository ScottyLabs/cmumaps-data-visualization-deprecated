import { ID } from "../shared/types";

export type IdSelectedType = "Node" | "Door" | "None";
export const NODE: IdSelectedType = "Node";
export const DOOR: IdSelectedType = "Door";
export const NONE: IdSelectedType = "None";

export interface IdSelectedInfo {
  id: ID;
  type: IdSelectedType;
}

export const DefaultIdSelected: IdSelectedInfo = { id: "", type: NONE };
