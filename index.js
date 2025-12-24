const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 5000;

app.use(cors());

/* ===============================
   GET: /api/astronauts
================================ */
app.get("/api/astronauts", async (req, res) => {
  try {
    const ASTRONAUTS_IN_SPACE_API = process.env.ASTRONAUTS_IN_SPACE_API;

    const targetUrl = "https://whoisinspace.com/";
    const scrapeUrl = `http://api.scrapestack.com/scrape?access_key=${ASTRONAUTS_IN_SPACE_API}&url=${encodeURIComponent(
      targetUrl
    )}`;

    const response = await fetch(scrapeUrl);
    const html = await response.text();

    const $ = cheerio.load(html);

    /* ===============================
       Extract Mission Dates (once)
    ================================ */
    const missionDates = [...html.matchAll(/new Date\("([^"]+)"\)/g)];

    /* ===============================
       Extract Astronauts (ALIGNED)
    ================================ */
    const astronauts = [];

    $("h2").each((i, el) => {
      const name = $(el).text().trim();

      // drop invalid / long names
      if (!name || name.length > 50) return;

      const image =
        $("img[data-image]").eq(i).attr("src") || null;

      const missionStart =
        missionDates[i] ? new Date(missionDates[i][1]) : null;

      astronauts.push({
        name,
        image,
        missionStart,
      });
    });

    res.json({
      success: true,
      count: astronauts.length,
      data: astronauts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch astronauts",
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
