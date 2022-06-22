const axios = require("axios");
const lib = require("../lib");

module.exports = {
  hostnames: ["rekonise.com"],
  requiresCaptcha: false, 
  get: async function(url) {
    try {
      let id = new URL(url).pathname;
      if (lib.config().debug == true) console.log("[rekonise] Requesting API...");

      let resp = await axios({
        method: "GET",
        url: `https://api.rekonise.com/unlocks${id}`,
        headers: {
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });
      if (lib.config().debug == true) console.log("[rekonise] Got API content.");

      return resp?.data?.url;
    } catch(err) {
      throw err;
    }
  }
}