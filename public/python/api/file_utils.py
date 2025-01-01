import sys
import json


def getOutlineData():
    f = open(
        "public/cmumaps-data/floor_plan/" + sys.argv[1] + "-outline.json",
        encoding="utf8",
    )
    return json.load(f)
