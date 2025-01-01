import json


# return true if the file name do not exist as a floor name in Nicolas-export.json
def add_type_and_alias(all_rooms, floor_name):
    f = open("public/cmumaps-data/Nicolas-export.json", encoding="utf8")
    data = json.load(f)

    for room in all_rooms.values():
        room["type"] = ""
        room["aliases"] = []

    if floor_name not in data["floors"]:
        return True

    room_list = data["floors"][floor_name]["rooms"]
    room_name_to_type_and_aliases = dict()
    for room in room_list:
        room_name_to_type_and_aliases[room["name"]] = dict()
        room_name_to_type_and_aliases[room["name"]]["type"] = room["type"]
        room_name_to_type_and_aliases[room["name"]]["aliases"] = []
        if "alias" in room and room["alias"] != "":
            room_name_to_type_and_aliases[room["name"]]["aliases"].append(room["alias"])

    for room in all_rooms.values():
        if room["name"] in room_name_to_type_and_aliases:
            type_and_aliases = room_name_to_type_and_aliases[room["name"]]
            if "type" in type_and_aliases:
                room["type"] = type_and_aliases["type"]
            if "aliases" in type_and_aliases:
                room["aliases"] = type_and_aliases["aliases"]

    return False
