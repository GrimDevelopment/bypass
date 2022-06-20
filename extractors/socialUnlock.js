const axios = require("axios");
const lib = require("../lib");

module.exports = {
  hostnames: ["social-unlock.com"],
  "requires-captcha": false,
  get: async function(url) {
    try {
      if (lib.config().debug == true) console.log("[social-unlock] Reformatting URL...");
      url = url.split("/").slice(0, 3).join("/") + "/redirect/" + url.split("/").slice(3).join("/");

      if (lib.config().debug == true) console.log("[social-unlock] Reformatted. Requesting page...");
      let resp = await axios({
        method: "GET",
        url: url,
        headers: {
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        },
        validateStatus: function() {
          return true;
        },
        maxRedirects: 1
      });

      if (lib.config().debug == true) console.log("[social-unlock] Got page. Parsing Axios data...");
      if (resp.request?.socket?._httpMessage?._redirectable?._currentUrl !== url) {
        return resp.request.socket._httpMessage._redirectable._currentUrl;
      } else {
        throw "Redirect not found."
      }
    } catch(err) {
      throw err;
    }
  }
}