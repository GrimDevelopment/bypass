const axios = require("axios");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: ["karung.in"],
  requiresCaptcha: false,
  get: async function(url) {
    try {
      if (lib.config()["debug"] == true) console.log("[karung] Requesting page...");
      let resp = await axios({
        method: "GET",
        url: url,
        headers: {
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });
      if (lib.config()["debug"] == true) console.log("[karung] Got page. Parsing page...");

      let $ = cheerio.load(resp.data);
      let r = $("#makingdifferenttimer")[0]?.attribs?.href;
      if (lib.config()["debug"] == true) console.log("[karung] Parsed. Decoding data...");
      r = new URL(r);
      r = r.searchParams.get("r");
      r = Buffer.from(r, "base64").toString("ascii");
      return r;
    } catch(err) {
      throw err;
    }
  }
}