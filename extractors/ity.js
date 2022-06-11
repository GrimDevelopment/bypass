const axios = require("axios");
const cheerio = require("cheerio");

module.exports = {
  hostnames: ["ity.im"],
  "requires-captcha": false,
  get: async function(url) {
    try {
      let resp = await axios({
        method: "GET",
        url: url,
        headers: {
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });
  
      let $ = cheerio.load(resp.data);
  
      return $(".col-xs-6.col-md-4.vertical_center:not(#logo_div) a").attr("href");
    } catch(err) {
      throw err;
    }
  }
}