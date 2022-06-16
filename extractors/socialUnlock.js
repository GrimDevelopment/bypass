const axios = require("axios");

module.exports = {
  hostnames: ["social-unlock.com"],
  "requires-captcha": false,
  get: async function(url) {
    try {
      url = url.split("/").slice(0, 3).join("/") + "/redirect/" + url.split("/").slice(3).join("/");
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

      return resp.request.socket._httpMessage._redirectable._currentUrl;
    } catch(err) {
      throw err;
    }
  }
}