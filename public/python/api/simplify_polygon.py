import sys
from shapely import simplify, to_geojson  # type: ignore
from shapely.geometry import shape  # type: ignore

from file_utils import getOutlineData


def simplify_polygon(polygon):
    return simplify(shape(polygon), tolerance=5)


if __name__ == "__main__":
    rooms = getOutlineData()["rooms"]

    room_id = sys.argv[2]

    print(to_geojson(simplify_polygon(rooms[room_id]["polygon"])))
