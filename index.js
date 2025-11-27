import express from "express";
import fetch from "node-fetch";
import { exec } from "child_process";
import fs from "fs";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🔥 TeraFetch Backend Running with FFmpeg");
});

app.get("/api/merge", async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.json({ error: "Missing ?url parameter" });

  try {
    // WORKER API
    const apiURL =
      "https://terafetch.yaartunah.workers.dev/?url=" + encodeURIComponent(videoUrl);

    console.log("Calling worker:", apiURL);

    const data = await fetch(apiURL).then((r) => r.json());

    console.log("Worker Result:", data);

    if (!data || !data.stream)
      return res.json({
        error: "No downloadable stream found",
        details: data,
      });

    const m3u8 = data.stream;

    const outputFile = `/tmp/video_${Date.now()}.mp4`;

    const cmd = `ffmpeg -i "${m3u8}" -c copy -bsf:a aac_adtstoasc "${outputFile}"`;

    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        return res.json({
          error: "FFmpeg error",
          details: stderr,
        });
      }

      res.download(outputFile, "terabox_video.mp4", () => {
        fs.unlinkSync(outputFile);
      });
    });
  } catch (e) {
    res.json({ error: "Server error", details: e });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server Started on " + PORT));
