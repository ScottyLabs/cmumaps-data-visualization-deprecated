import pymupdf  # type: ignore


def connect_two_lines(L1, L2):
    epsilon = 0.1
    if L1[0].distance_to(L2[0]) < epsilon:
        return [L1[1], L2[1]]
    if L1[1].distance_to(L2[0]) < epsilon:
        return [L1[0], L2[1]]
    if L1[0].distance_to(L2[1]) < epsilon:
        return [L1[1], L2[0]]
    if L1[1].distance_to(L2[1]) < epsilon:
        return [L1[0], L2[0]]


def get_end_points_LEDR(doc):
    layers = doc.layer_ui_configs()

    # set all layers except the layer in interest off
    for layer in layers:
        if layer["text"] != "A-SPAC-IDEN-LEDR":
            doc.set_layer_ui_config(layer["number"], 2)
        else:
            doc.set_layer_ui_config(layer["number"], 0)

    page = doc[0]
    shapes = page.get_drawings()

    LEDR_EndPoints = []

    for shape in shapes:
        allLines = []

        for line in shape["items"]:
            if line[0] == "l":
                L = [line[1], line[2]]
            elif line[0] == "c":
                raise Exception("Good chance to test bezier for LEDR!")
            else:
                raise Exception("No way LEDR contains a polygon... right?")
            allLines.append(L)

        LEDR_EndPoints.append([allLines[0][0], allLines[-1][-1]])

    return LEDR_EndPoints


def get_room_label_positions(pdf_path):
    doc = pymupdf.open(pdf_path)
    layers = doc.layer_ui_configs()

    page = doc[0]

    # set all layers except the layer in interest off
    for layer in layers:
        if layer["text"] != "A-SPAC-IDEN-RMNO":
            doc.set_layer_ui_config(layer["number"], 2)
        else:
            doc.set_layer_ui_config(layer["number"], 0)

    # room label to position
    roomLabel_to_pos = dict()
    allBlocks = page.get_text("dict")["blocks"]

    def getBboxCenter(bbox):
        return [
            (round((bbox[0] + bbox[2]) / 2, 2)),
            (round((bbox[1] + bbox[3]) / 2, 2)),
        ]

    for block in allBlocks:
        for line in block["lines"]:
            curText = line["spans"][0]["text"]
            roomLabel_to_pos[curText] = getBboxCenter(line["spans"][0]["bbox"])

    # RMNOLines are the lines under the room labels
    RMNOLines = list(
        map(lambda RMNOLine: RMNOLine["items"][0][1:], page.get_drawings())
    )

    # LEDR is that dot with lines thing that translate the room label
    LEDR_EndPoints = get_end_points_LEDR(doc)

    # RMNOLine to its endPoints
    RMNOLine_to_EndPoint = dict()

    for RMNOLine in RMNOLines:
        for endPoint in LEDR_EndPoints:
            res = connect_two_lines(endPoint, RMNOLine)
            if res is not None:
                RMNOLine_to_EndPoint[RMNOLine] = (
                    (round(res[0][0], 2)),
                    (round(res[0][1], 2)),
                )

    # fix room label positions using the LEDR
    def average_point(point1, point2):
        x_avg = (point1[0] + point2[0]) / 2
        y_avg = (point1[1] + point2[1]) / 2
        return pymupdf.Point(x_avg, y_avg)

    for roomLabel in roomLabel_to_pos:
        center = pymupdf.Point(
            roomLabel_to_pos[roomLabel][0], roomLabel_to_pos[roomLabel][1]
        )
        for RMNOLine in RMNOLines:
            average = average_point(RMNOLine[0], RMNOLine[1])
            if center.distance_to(average) < 5:
                if RMNOLine in RMNOLine_to_EndPoint:
                    roomLabel_to_pos[roomLabel] = RMNOLine_to_EndPoint[RMNOLine]

    return roomLabel_to_pos
