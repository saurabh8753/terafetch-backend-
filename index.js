import express from "express";
import fetch from "node-fetch";
import { exec } from "child_process";
import fs from "fs";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("TeraFetch Backend Live ✔");
});

// MAIN API
app.get("/api/merge", async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl)
    return res.json({ error: "Missing ?url parameter" });

  try {
    // Step 1: Extract m3u8 playlist URL
    const apiURL =
      "https://terafetch.your-worker.workers.dev/?url=" + encodeURIComponent(videoUrl);

    const json = await fetch(apiURL).then((r) => r.json());

    if (!json.stream)
      return res.json({ error: "No stream found", details: json });

    const m3u8 = json.stream;

    // Step 2: TEMP FILE PATHS
    const outputFile = `/tmp/output_${Date.now()}.mp4`;

    // Step 3: ffmpeg command
    const cmd = `ffmpeg -i "${m3u8}" -c copy -bsf:a aac_adtstoasc "${outputFile}"`;

    exec(cmd, async (err) => {
      if (err) {
        return res.json({ error: "FFmpeg merge failed", details: err });
      }

      // Step 4: Send file to user
      res.download(outputFile, "terabox_video.mp4", () => {
        fs.unlinkSync(outputFile);
      });
    });
  } catch (e) {
    res.json({ error: "Server error", details: e });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on " + PORT));
