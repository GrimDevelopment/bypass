const axios = require("axios");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: ["mboost.me"],
  requiresCaptcha: false,
  get: async function(url) {
    try {
      if (lib.config().debug == true) console.log("[mboost] Requesting page...");
      let resp = await axios({
        method: "GET",
        url: url,
        headers: {
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });

      let $ = cheerio.load(resp.data);
      if (lib.config().debug == true) console.log("[mboost] Got page. Parsing page...");

      if ($("#__NEXT_DATA__")) {
        if (lib.config().debug == true) console.log(`[mboost] Parsed page. Parsing JSON "__NEXT_DATA__" information...`);
        let d = $("#__NEXT_DATA__")[0]?.children[0]?.data;
        d = JSON.parse(d);
        if (lib.config().debug == true) console.log("[mboost] Parsed JSON. Retrieving URL...");
        if (lib.isUrl(d.props?.initialProps?.pageProps?.data?.targeturl)) {
          return d.props?.initialProps?.pageProps?.data?.targeturl;
        }
        throw "Redirect not found.";
      } else {
        throw "Redirect not found.";
      }
    } catch(err) {
      throw err;
    }
  }
}
