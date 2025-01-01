import pymupdf  # type: ignore
from shapely import Polygon, LineString, GeometryCollection  # type: ignore


def get_points(shape):
    all_lines = []
    for item in shape["items"]:
        # line
        if item[0] == "l":
            all_lines.append(item[1])
            all_lines.append(item[2])
        # bezier curve
        elif item[0] == "c":
            all_lines.append(item[1])
            all_lines.append(item[4])
        # quad
        elif item[0] == "qu":
            all_lines.extend(item[1])
    return all_lines


def get_room_polygons(pdf_path):
    doc = pymupdf.open(pdf_path)
    colorGons = {}

    layers = doc.layer_ui_configs()

    for layer in layers:
        if layer["text"] != "A-SPAC-PATT":
            doc.set_layer_ui_config(layer["number"], 2)
        else:
            doc.set_layer_ui_config(layer["number"], 0)

    page = doc[0]
    shapes = page.get_drawings()

    for shape in shapes:
        polylines = get_points(shape)

        if len(polylines) > 2:
            if shape["fill"] not in colorGons:
                colorGons[shape["fill"]] = []
            polylines.append(polylines[0])

            newPolygon = (LineString([(p.x, p.y) for p in polylines])).convex_hull
            colorGons[shape["fill"]].append(newPolygon)

    # print(colorGons)

    for _, polygons in colorGons.items():
        didcollapseone = True

        while didcollapseone:
            didcollapseone = False
            for i in range(len(polygons)):
                for j in range(i + 1, len(polygons)):
                    if i >= len(polygons) or j >= len(polygons):
                        break
                    if polygons[i].intersects(polygons[j]):
                        didcollapseone = True
                        polygons[j] = polygons[j].union(polygons[i])
                        polygons.pop(i)

    pgs = [pg for mpgs in colorGons.values() for pg in mpgs]

    for i in range(len(pgs)):
        polygon = pgs[i]
        if isinstance(polygon, GeometryCollection):
            for p in pgs.pop(i).geoms:
                if isinstance(p, Polygon):
                    pgs.append(p)

    allRoomPolygons = []

    for polygon in pgs:
        if not isinstance(polygon, Polygon):
            continue

        rounded_interiors = []
        for interior in polygon.interiors:
            rounded_interiors.append(
                [(round(p[0], 2), round(p[1], 2)) for p in interior.coords]
            )

        rounded_exterior = [
            (round(p[0], 2), round(p[1], 2)) for p in polygon.exterior.coords
        ]
        allRoomPolygons.append(Polygon(rounded_exterior, rounded_interiors))

    return allRoomPolygons
