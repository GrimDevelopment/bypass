const axios = require("axios");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: ["boostme.link"],
  requiresCaptcha: false,
  get: async function(url) {
    try {
      if (lib.config().debug == true) console.log("[boostme] Requesting page...");
      let resp = await axios({
        method: "GET",
        url: url,
        headers: {
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });
  
      let $ = cheerio.load(resp.data);
      if (lib.config().debug == true) console.log("[boostme] Got page. Decoding page...");
      
      return Buffer.from($(".main #home").attr("data-url"), "base64").toString("ascii");
    } catch(err) {
      throw err;
    }
  }
}