const axios = require("axios");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: ["tei.ai", "tii.ai"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
      if (lib.config().debug == true) console.log("[teiai] Requesting page...");

      let resp = await axios({
        method: "GET",
        url: url,
        headers: {
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        },
        validateStatus: function() {
          return true;
        }
      });

      if (lib.config().debug == true) console.log("[teiai] Got page. Parsing page...");
      let $ = cheerio.load(resp.data);

      if (lib.config().debug == true) console.log("[teiai] Parsed. Decoding token...");

      let token = $("#link-view form [name='token']")?.val()?.split("aHR")?.slice(1)?.join("aHR");
      token = `aHR${token}`;
      token = Buffer.from(token, "base64").toString();
      return token;
    } catch(err) {
      throw err;
    }
    
  }
}