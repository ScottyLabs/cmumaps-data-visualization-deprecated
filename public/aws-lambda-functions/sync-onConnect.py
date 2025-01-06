import boto3  # type: ignore
import json
import logging
import random

logger = logging.getLogger()
logger.setLevel("INFO")

dynamo = boto3.resource("dynamodb").Table("cmumaps-data-visualization-connections")


def generate_random_color():
    return "#" + "".join([random.choice("0123456789ABCDEF") for j in range(6)])


def lambda_handler(event, context):
    try:
        # post to database
        connection_id = event["requestContext"]["connectionId"]
        user_name = event["queryStringParameters"]["userName"]
        floor_code = event["queryStringParameters"]["floorCode"]
        json_obj = {
            "UserName": user_name,
            "FloorCode": floor_code,
            "Token": connection_id,
            "Color": generate_random_color(),
        }
        dynamo.put_item(Item=json_obj)
        return {"statusCode": 200}
    except Exception as e:
        logger.error(e)
        return {"statusCode": 400, "body": json.dumps({"error": str(e)})}
