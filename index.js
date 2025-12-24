const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ===============================
   ✅ CORS — MUST BE FIRST
================================ */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

/* ===============================
   HEALTH CHECK (IMPORTANT FOR RENDER)
================================ */
app.get("/", (req, res) => {
  res.send("🚀 Backend is running");
});

/* ===============================
   GET: /api/astronauts
================================ */
app.get("/api/astronauts", async (req, res) => {
  try {
    const ASTRONAUTS_IN_SPACE_API = process.env.ASTRONAUTS_IN_SPACE_API;

    if (!ASTRONAUTS_IN_SPACE_API) {
      return res.status(500).json({
        success: false,
        message: "Missing Scrapestack API key"
      });
    }

    const targetUrl = "https://whoisinspace.com/";
    const scrapeUrl = `http://api.scrapestack.com/scrape?access_key=${ASTRONAUTS_IN_SPACE_API}&url=${encodeURIComponent(targetUrl)}`;

    const response = await fetch(scrapeUrl);
    const html = await response.text();

    const $ = cheerio.load(html);

    const missionDates = [...html.matchAll(/new Date\("([^"]+)"\)/g)];

    const astronauts = [];

    $("h2").each((i, el) => {
      const name = $(el).text().trim();
      if (!name || name.length > 50) return;

      const image = $("img[data-image]").eq(i).attr("src") || null;
      const missionStart = missionDates[i]
        ? new Date(missionDates[i][1]).toISOString()
        : null;

      astronauts.push({ name, image, missionStart });
    });

    res.json({
      success: true,
      count: astronauts.length,
      data: astronauts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch astronauts",
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
