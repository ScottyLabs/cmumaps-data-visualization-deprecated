import json
from ..add_floorplan.door_utils import link_doors_with_rooms, combine_doors
from file_utils import getOutlineData


def relink(data):
    doors = data["doors"]
    rooms = data["rooms"]

    door_line_list = []

    for door in doors.values():
        door_line_list.extend(door["lineList"])

    output = dict()

    door_line_list = combine_doors(door_line_list)

    output["doors"], output["roomlessDoors"] = link_doors_with_rooms(
        door_line_list, rooms, geo_jsoned=True
    )

    print(json.dumps(output))


if __name__ == "__main__":
    relink(getOutlineData())
