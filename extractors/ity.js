const axios = require("axios");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: ["ity.im"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
      if (lib.config().debug == true) console.log("[ityim] Requesting page...");
      let resp = await axios({
        method: "GET",
        url: url,
        headers: {
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });
  
      if (lib.config().debug == true) console.log("[ityim] Got page. Parsing page...");
      let $ = cheerio.load(resp.data);
  
      return $(".col-xs-6.col-md-4.vertical_center:not(#logo_div) a").attr("href");
    } catch(err) {
      throw err;
    }
  }
}