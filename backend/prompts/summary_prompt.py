def build_summary_prompt(transcript: str) -> str:
    return f"""
You are an educational AI assistant.

Summarize the following YouTube transcript.

IMPORTANT:
Return ONLY valid JSON.

Do not wrap the JSON inside markdown.
Do not use ```json.
Do not add explanations before or after the JSON.

Use this exact structure:

{{
  "overview":"",
  "key_points":[
      "",
      "",
      ""
  ],
  "important_concepts":[
      {{
          "term":"",
          "meaning":""
      }}
  ],
  "takeaway":""
}}

Transcript:

{transcript}
"""