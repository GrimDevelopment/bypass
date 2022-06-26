const axios = require("axios");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: ["psa.pm"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    let u = new URL(url).pathname.split("/")[1];
    if (u !== "exit") throw "Invalid psa.pm link.";

    if (lib.config().debug == true) console.log("[psa] Requesting page...");
    let resp = await axios({
      method: "GET",
      url: url,
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      }
    });

    if (lib.config().debug == true) console.log("[psa] Done. Parsing page...");
    let $ = cheerio.load(resp.data);
    return $("form")?.attr("action");
  }
}