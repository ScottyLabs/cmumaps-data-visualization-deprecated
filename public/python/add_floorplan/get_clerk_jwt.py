import os
from dotenv import load_dotenv
import requests  # type: ignore

load_dotenv()
USER_ID = os.getenv("CLERK_USER_ID")
CLERK_API_KEY = os.getenv("CLERK_SECRET_KEY")


def get_clerk_jwt():
    headers = {
        "Authorization": f"Bearer {CLERK_API_KEY}",
        "Content-Type": "application/json",
    }

    response = requests.post(
        "https://api.clerk.com/v1/sessions", headers=headers, json={"user_id": USER_ID}
    )

    session_id = response.json()["id"]

    response = requests.post(
        f"https://api.clerk.com/v1/sessions/{session_id}/tokens", headers=headers
    )

    return response.json()["jwt"]
