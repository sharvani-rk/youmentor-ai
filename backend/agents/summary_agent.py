from agents.transcript_agent import get_transcript
from prompts.summary_prompt import build_summary_prompt
from services.groq_service import ask_groq
import json

def generate_summary(video_url: str):

    transcript = get_transcript(video_url)

    prompt = build_summary_prompt(transcript)

    summary = ask_groq(prompt)

    return json.loads(summary)


if __name__ == "__main__":

    url = input("Enter YouTube URL: ")

    result = generate_summary(url)

    print(result)