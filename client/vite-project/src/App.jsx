import React, { useState } from "react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setTranscript("");
    setError("");
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setTranscript("");
    setError("");
    const formData = new FormData();
    formData.append("video", file);

    try {
      const res = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setTranscript(data.transcript || "No transcript found.");
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      setError("Error during upload or transcription.");
    }
    setLoading(false);
  };

  return (
    <div className="app">
      <h1>🎧 Gistly</h1>
      <p className="subtitle">Drop your video. Get the gist.</p>

      <label className="file-label">
        <input type="file" accept="video/*" onChange={handleFileChange} />
        {file ? file.name : "Choose a video file"}
      </label>

      <button onClick={handleUpload} disabled={loading}>
        {loading ? <span className="loader"></span> : "Upload & Transcribe"}
      </button>

      {error && <p className="error">⚠️ {error}</p>}

      {transcript && (
        <div className="output">
          <h3>📝 Transcript:</h3>
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
}

export default App;
