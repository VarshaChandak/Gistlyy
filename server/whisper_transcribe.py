# whisper_transcribe.py
import sys
import whisper

model = whisper.load_model("base")
audio_path = sys.argv[1]

result = model.transcribe(audio_path)
print(result["text"])
