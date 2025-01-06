import json
import boto3  # type: ignore
import logging

logger = logging.getLogger()
logger.setLevel("INFO")

dynamo = boto3.resource("dynamodb").Table("cmumaps-data-visualization-connections")


def lambda_handler(event, context):
    try:
        # get sender's floor
        floor_code = event["queryStringParameters"]["floorCode"]

        # get all users on this floor
        response = dynamo.scan(
            FilterExpression="FloorCode = :floorCodeValue",
            ExpressionAttributeValues={":floorCodeValue": floor_code},
        )

        return {
            "statusCode": 200,
            "body": len(response["Items"]),
        }
    except Exception as e:
        logger.error(e)
        return {"statusCode": 400, "body": json.dumps({"error": str(e)})}
