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

        # change the floor code of the sender
        old_item = dynamo.update_item(
            Key={"Token": event["requestContext"]["connectionId"]},
            UpdateExpression="set FloorCode=:f",
            ExpressionAttributeValues={":f": floor_code},
            ReturnValues="UPDATED_OLD",
        )

        # send old floor code to the sender
        old_floor_code = old_item["Attributes"]["FloorCode"]
        client.post_to_connection(
            ConnectionId=event["requestContext"]["connectionId"],
            Data=json.dumps({"type": "leaveFloor", "oldFloorCode": old_floor_code}),
        )
        return {"statusCode": 200}
    except Exception as e:
        logger.error(e)
        return {"statusCode": 400, "body": json.dumps({"error": str(e)})}
