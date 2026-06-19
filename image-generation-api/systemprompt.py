import os

from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise SystemExit("Set GEMINI_API_KEY before running this script.")

client = genai.Client(api_key=api_key)

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Write a quote about success",
)

print(response.text)

