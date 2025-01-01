import json
import boto3  # type: ignore
import logging

logger = logging.getLogger()
logger.setLevel("INFO")

client = boto3.client(
    "apigatewaymanagementapi",
    endpoint_url="https://ciqtltfsn7.execute-api.us-east-2.amazonaws.com/prod",
)

dynamo = boto3.resource("dynamodb").Table("cmumaps-data-visualization-connections")


def lambda_handler(event, context):
    try:
        # get sender's floor
        body = json.loads(event["body"])
        floor_code = body["floorCode"]

        # get all users on this floor
        response = dynamo.scan(
            FilterExpression="FloorCode = :floorCodeValue",
            ExpressionAttributeValues={":floorCodeValue": floor_code},
        )

        # send user count to all users on this floor
        for connection in response["Items"]:
            client.post_to_connection(
                ConnectionId=connection["Token"],
                Data=json.dumps({"userCount": len(response["Items"])}).encode("utf-8"),
            )
        return {"statusCode": 200}
    except Exception as e:
        logger.error(e)
        return {"statusCode": 400, "body": json.dumps({"error": str(e)})}
