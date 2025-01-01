import json
import uuid
import pymupdf  # type: ignore  # noqa: F401
import sys
from shapely import Point, Polygon, to_geojson  # type: ignore
from public.python.add_floorplan.door_utils import combine_doors, link_doors_with_rooms
from label_detection import get_room_label_positions
from room_detection import get_room_polygons
from add_type_and_alias import add_type_and_alias


# convert a shape (line, bezier curve)
def get_json_lines(shape):
    def create_line(p1, p2):
        return [round(p1.x, 2), round(p1.y, 2), round(p2.x, 2), round(p2.y, 2)]

    all_lines = []
    for item in shape["items"]:
        # line
        if item[0] == "l":
            all_lines.append(create_line(item[1], item[2]))
        # bezier curve
        elif item[0] == "c":
            curList = []
            for cur in ([round(p.x, 2), round(p.y, 2)] for p in item[1:]):
                curList.extend(cur)
            all_lines.append(curList)
        # quad
        elif item[0] == "qu":
            all_lines.append(create_line(item[1].ul, item[1].ur))
            all_lines.append(create_line(item[1].ur, item[1].lr))
            all_lines.append(create_line(item[1].lr, item[1].ll))
            all_lines.append(create_line(item[1].ll, item[1].ul))
    return all_lines


def parse_pdf(pdf_path):
    output = dict()

    doc = pymupdf.open(pdf_path)

    page = doc[0]

    shapes = page.get_drawings()

    # get all space dividers
    all_walls = []
    all_doors = []
    all_rooms = []

    for shape in shapes:
        # A-GLAZ for Glass Walls
        # A-SPAC-OTBW for Gates Helix
        if (
            shape["layer"] == "A-WALL"
            or shape["layer"] == "A-GLAZ"
            or shape["layer"] == "A-SPAC-OTBW"
        ):
            all_walls.extend(get_json_lines(shape))
        elif shape["layer"] == "A-DOOR":
            all_doors.extend(get_json_lines(shape))
        elif shape["layer"] == "A-SPAC-PATT":
            all_rooms.append(shape)

    output["walls"] = all_walls

    # edge case of campus outside
    if len(all_doors) == 0:
        output["doors"] = dict()
        output["roomlessDoors"] = list()
        output["floorCodeDNE"] = True
        output["rooms"] = dict()
        output["graph"] = dict()
        print(json.dumps(output))
        return

    output["doors"] = combine_doors(all_doors)

    # get all rooms
    all_rooms = dict()

    room_label_to_pos = get_room_label_positions(pdf_path)
    room_polygons = get_room_polygons(pdf_path)
    label_to_id = dict()

    for label in room_label_to_pos:
        curID = str(uuid.uuid4())
        label_to_id[label] = curID

        new_room = dict()
        new_room["name"] = label
        new_room["labelPosition"] = dict()
        new_room["labelPosition"]["x"] = room_label_to_pos[label][0]
        new_room["labelPosition"]["y"] = room_label_to_pos[label][1]
        new_room["polygon"] = Polygon()

        # find room polygon
        for roomPolygon in room_polygons:
            point = Point(room_label_to_pos[label][0], room_label_to_pos[label][1])
            if roomPolygon.contains(point):
                new_room["polygon"] = roomPolygon
        all_rooms[curID] = new_room

    output["doors"], output["roomlessDoors"] = link_doors_with_rooms(
        output["doors"], all_rooms
    )

    output["floorCodeDNE"] = add_type_and_alias(
        all_rooms, pdf_path.split("/")[-1].replace(".pdf", "")
    )

    for room in all_rooms.values():
        if "polygon" in room:
            # delete to move it to the end of the object
            polygon = room["polygon"]
            del room["polygon"]
            room["polygon"] = json.loads(to_geojson(polygon))

    output["rooms"] = all_rooms

    # graph of only room nodes
    graph = dict()
    for label in room_label_to_pos:
        cur_id = str(uuid.uuid4())

        new_node = dict()
        new_node["pos"] = dict()
        new_node["pos"]["x"] = room_label_to_pos[label][0]
        new_node["pos"]["y"] = room_label_to_pos[label][1]
        new_node["neighbors"] = dict()
        new_node["roomId"] = label_to_id[label]

        graph[cur_id] = new_node

    output["graph"] = graph

    print(json.dumps(output))


if __name__ == "__main__":
    parse_pdf("public/pdf/" + sys.argv[1])
