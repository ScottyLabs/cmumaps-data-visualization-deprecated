import os
from dotenv import load_dotenv
import requests  # type: ignore

from get_clerk_jwt import get_clerk_jwt

load_dotenv()
AWS_API_INVOKE_URL = os.getenv("NEXT_PUBLIC_AWS_API_INVOKE_URL")

headers = {
    "Authorization": f"Bearer {get_clerk_jwt()}",
    "Content-Type": "application/json",
}


def put_outline_json(data):
    response = requests.put(
        f"{AWS_API_INVOKE_URL}/development/put-outline-json",
        headers=headers,
        json=data,
    )

    return response.status_code
