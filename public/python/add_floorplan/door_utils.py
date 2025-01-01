import math
import uuid
from scipy.cluster.hierarchy import linkage, fcluster
from scipy.spatial.distance import pdist
from shapely import Point, LineString, LinearRing  # type: ignore
from shapely.geometry import shape  # type: ignore


# If the first two coordinates of a ring are the same,
# Shapely gives RuntimeWarning: invalid value encountered in distance
def clean_ring_coordinates(ring):
    coords = list(ring.coords)
    if len(coords) > 1 and coords[0] == coords[1]:
        coords.pop(0)
    return LinearRing(coords)


# to prevent two doors in a room
def combine_doors(all_doors):
    all_doors_endpoints = [(door[0], door[1], door[-2], door[-1]) for door in all_doors]

    def min_line_distance(line1, line2):
        distances = [
            math.dist((line1[0], line1[1]), (line2[0], line2[1])),
            math.dist((line1[2], line1[3]), (line2[0], line2[1])),
            math.dist((line1[0], line1[1]), (line2[2], line2[3])),
            math.dist((line1[2], line1[3]), (line2[2], line2[3])),
        ]
        return min(distances)

    distance_threshold = 3.5

    distances = pdist(all_doors_endpoints, lambda u, v: min_line_distance(u, v))

    # Perform hierarchical clustering
    Z = linkage(distances, method="single")

    # Form flat clusters
    clusters = fcluster(Z, t=distance_threshold, criterion="distance")

    # Group lines by clusters
    grouped_lines = {}
    for idx, cluster_id in enumerate(clusters):
        if cluster_id not in grouped_lines:
            grouped_lines[cluster_id] = []
        grouped_lines[cluster_id].append(all_doors[idx])

    return list(grouped_lines.values())


def get_end_points_from_lines(lines, polygon):
    beziers = list(filter(lambda line: len(line) == 8, lines))
    non_beziers = list(filter(lambda line: len(line) != 8, lines))

    if len(beziers) == 0 or len(non_beziers) == 0:
        return None

    def find_closest_point_to_polygon(lines):
        closest_point = None
        min_dist = None

        for line in lines:
            for point in (Point(line[0], line[1]), Point(line[-2], line[-1])):
                dist = point.distance(clean_ring_coordinates(polygon.exterior))

                for interior in polygon.interiors:
                    dist = min(dist, point.distance(interior))

                if min_dist is None or dist < min_dist:
                    min_dist = dist
                    closest_point = point

        return closest_point

    return (
        find_closest_point_to_polygon(beziers),
        find_closest_point_to_polygon(non_beziers),
    )


def link_doors_with_rooms(all_doors, all_rooms, geo_jsoned=False):
    """
    all_doors should be in the format of a list,
    where each item is the list of all the points that outlines the shape of at least a door.

    all_rooms (polygon geojsoned depending on the optional parameter)
    """
    new_all_doors = dict()

    roomless_doors = []

    # separate doors by room polygons
    for list_list in all_doors:
        cur_dict = dict()

        for line in list_list:
            p1, p2 = (Point(line[0], line[1]), Point(line[-2], line[-1]))

            # a list of rooms this line belongs to
            room_ids = []
            for room_id in all_rooms:
                if "polygon" in all_rooms[room_id]:
                    if geo_jsoned:
                        all_rooms[room_id]["polygon"] = shape(
                            all_rooms[room_id]["polygon"]
                        )
                    polygon = all_rooms[room_id]["polygon"]
                    if polygon.contains(p1) or polygon.contains(p2):
                        room_ids.append(room_id)

            # a door that is not in exactly one room is invalid and added to roomless
            if len(room_ids) != 1:
                roomless_doors.append(line)
                continue

            # otherwise add to the current dictionary
            if room_ids[0] not in cur_dict:
                cur_dict[room_ids[0]] = []
            cur_dict[room_ids[0]].append(line)

        # create an entry for each room in the dictionary
        for room_id in cur_dict:
            cur_door = dict()
            cur_door["roomIds"] = [room_id]
            cur_door["lineList"] = cur_dict[room_id]
            new_all_doors[str(uuid.uuid4())] = cur_door

    # reflect the far end point of the curve of the door across the gap of the door
    for _, cur_door in new_all_doors.items():
        # find the average of all the points on the lines
        def get_average(lines):
            lines = [[(line[0], line[1]), (line[-2], line[-1])] for line in lines]

            sum_x, sum_y = 0, 0

            for line in lines:
                for point in line:
                    sum_x += point[0]
                    sum_y += point[1]

            return Point(sum_x / len(lines) / 2, sum_y / len(lines) / 2)

        center_point = get_average(cur_door["lineList"])
        cur_door["center"] = dict()
        cur_door["center"]["x"] = round(center_point.x, 2)
        cur_door["center"]["y"] = round(center_point.y, 2)

        end_points = get_end_points_from_lines(
            cur_door["lineList"], all_rooms[cur_door["roomIds"][0]]["polygon"]
        )

        if end_points is None:
            continue

        def reflect_point_across_line(point, line):
            x1, y1 = point.x, point.y

            # Extract line coordinates
            x2, y2 = line.coords[0]
            x3, y3 = line.coords[1]

            if (x2, y2) == (x3, y3):
                # Reflect point across the single point (line endpoints are the same)
                x_reflected = 2 * x2 - x1
                y_reflected = 2 * y2 - y1

            else:
                # Line equation coefficients (Ax + By + C = 0)
                A = y2 - y3
                B = x3 - x2
                C = x2 * y3 - x3 * y2

                # Calculate the reflection of the point across the line
                d = (A * x1 + B * y1 + C) / (A**2 + B**2)
                x_reflected = x1 - 2 * A * d
                y_reflected = y1 - 2 * B * d

            return Point(x_reflected, y_reflected)

        reflected_point = reflect_point_across_line(
            center_point, LineString(end_points)
        )

        for room_id in all_rooms:
            if "polygon" in all_rooms[room_id]:
                polygon = all_rooms[room_id]["polygon"]
                if polygon.contains(reflected_point):
                    if room_id not in cur_door["roomIds"]:
                        cur_door["roomIds"].append(room_id)

    return new_all_doors, roomless_doors
