const axios = require("axios");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: ["show.co"],
  requiresCaptcha: false,
  get: async function(url) {
    try {
      if (lib.config().debug == true) console.log("[show] Requesting page...");
      let resp = await axios({
        method: "GET",
        url: url,
        headers: {
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });

      if (lib.config().debug == true) console.log("[show] Got page. Parsing page...");
      let $ = cheerio.load(resp.data);

      if ($("#show-campaign-data")) {
        if (lib.config().debug == true) console.log("[show] Parsed. Parsing JSON data...");
        let d = $("#show-campaign-data")[0]?.children[0]?.data;
        d = JSON.parse(d);
        if (lib.isUrl(d.unlockable?.redirect?.url)) {
          return d.unlockable.redirect.url;
        } else {
          if (lib.config().debug == true) console.log("[show] JSON data does not contain needed information.");
          throw "Redirect not found."
        }
      } else {
        if (lib.config().debug == true) console.log("[show] Page does not contain needed information.");
        throw "Redirect not found.";
      }
    } catch(err) {
      throw err;
    }
  }
}