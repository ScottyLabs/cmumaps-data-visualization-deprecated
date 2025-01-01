import boto3  # type: ignore
import json
import logging

logger = logging.getLogger()
logger.setLevel("INFO")

dynamo = boto3.resource("dynamodb").Table("cmumaps-data-visualization-connections")


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
        }
        dynamo.put_item(Item=json_obj)
        return {"statusCode": 200}
    except Exception as e:
        logger.error(e)
        return {"statusCode": 400, "body": json.dumps({"error": str(e)})}
