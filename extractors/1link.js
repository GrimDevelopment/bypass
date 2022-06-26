const axios = require("axios");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: ["1link.club"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
      if (lib.config()["debug"] == true) console.log("[1link] Requesting page...");
      let resp = await axios({
        method: "GET",
        url: url,
        headers: {
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });

      if (lib.config().debug == true) console.log("[1link] Got page. Parsing page...");
      let $ = cheerio.load(resp.data);

      if (lib.isUrl($("#download")[0]?.attribs?.href)) return $("#download")[0]?.attribs?.href;

      throw "Redirect not found.";
    } catch(err) {
      throw err;
    }
  }
}