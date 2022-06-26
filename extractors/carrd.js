const axios = require("axios");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: [],
  requireCaptcha: false,
  get: async function(url, opt) {
    if (lib.config().debug == true) console.log("[carrd] Requesting page...");
    let resp = await axios({
      method: "GET",
      url: url,
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    if (lib.config().debug == true) console.log("[carrd] Got page, parsing...");
    let $ = cheerio.load(resp.data);
    let links = [];

    if (lib.config().debug == true) console.log("[carrd] Parsed. Filtering out unviewable links...");
    await ($("a").each(function(a) {
      let h = $("a")[a].attribs?.href;
      if (h !== null) {
        if (!h.startsWith("#") && !h.startsWith("/") && h !== "https://carrd.co/build?ref=auto") links.push(h);
      }
    }));

    return {destinations: links};
  }
}