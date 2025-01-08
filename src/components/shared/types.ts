import { Polygon } from "geojson";

export interface PDFCoordinate {
  x: number;
  y: number;
}

/**
 * Unique ID (UUID)
 * */
export type ID = string;

/**
 * name of the pdf file it is in
 * */
export type Floor = string;

/**
 * Edge Types
 */
export const EdgeTypeList = [
  "ramp",
  "stairs",
  "elevator",
  "", // not assigned
];

export type EdgeType = (typeof EdgeTypeList)[number];

export interface ToFloorInfo {
  toFloor: Floor;
  /**
   *  "ramp" | "stairs" | "elevator" | "inside" | "outside" | ""
   **/
  type: EdgeType;
}

/**
 * Graph types
 */
export interface Edge {
  toFloorInfo?: ToFloorInfo;
}

/**
 * Graph types
 */
export interface Node {
  /**
   * the position (x and y coordinates) of the node
   */
  pos: PDFCoordinate;

  /**
   * (neighbor's id to the edge) for each neighbor of the node
   */
  neighbors: Record<ID, Edge>;

  /**
   * the ID of the Room the node belongs to
   * ${buildingCode}-${roomName}
   */
  roomId: ID;

  /**
   * Most recent update timestamp as a string value in ISO format.
   */
  updatedAt: string;
}

/**
 * Door type
 */
export interface DoorInfo {
  /**
   * list of lines that outlines the door
   */
  lineList: number[][];

  /**
   * center of the door points
   */
  center: PDFCoordinate;

  /**
   * the id of the rooms this door connects
   */
  roomIds: ID[];
}

/**
 * Room types
 */
export const RoomTypeList = [
  "Default",
  "Corridor",
  "Auditorium",
  "Office",
  "Classroom",
  "Operational", // Used for storage or maintenance, not publicly accessible
  "Conference",
  "Study",
  "Laboratory",
  "Computer Lab",
  "Studio",
  "Workshop",
  "Vestibule",
  "Storage",
  "Restroom",
  "Stairs",
  "Elevator",
  "Ramp",
  "Dining",
  "Food",
  "Store",
  "Library",
  "Sport",
  "Parking",
  "Inaccessible",
  "", // not assigned
] as const;

export type RoomType = (typeof RoomTypeList)[number];

export const WalkwayTypeList = ["Corridor", "Ramp", "Library"];

export interface RoomInfo {
  /**
   * The short name of the room, without the building name but including the
   * floor level (e.g. '121' for CUC 121)
   */
  name: string;

  /**
   * The coordinates of the label of the room
   */
  labelPosition: PDFCoordinate;

  /**
   * The type of the room
   */
  type: RoomType;

  /**
   * The name under which the room is known (e.g. 'McConomy Auditorium')
   * The one that will be displayed.
   */
  displayAlias: string;

  /**
   * List of names under which the room is known (e.g. 'McConomy Auditorium')
   * Used for searching
   */
  aliases: string[];

  /**
   * Geojson polygon that outlines the room
   */
  polygon: Polygon;
}

export type Rooms = Record<ID, RoomInfo>;
export type Nodes = Record<ID, Node>;

export type Mst = Record<ID, Record<ID, boolean>>;
