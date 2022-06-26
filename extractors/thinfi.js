const axios = require("axios");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: ["thinfi.com"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
      let resp; 

      if (opt.password) {
        if (lib.config().debug == true) console.log("[thinfi] Password was sent in request, sending password request...");
        resp = await axios({
          method: "POST",
          url: url,
          data: `password=${encodeURIComponent(opt.password)}`,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate",
            "Connection": "keep-alive"
          },
          validateStatus: function(stat) {
            if (stat == 500 || stat == 200) return true;
          }
        });
      } else {
        if (lib.config().debug == true) console.log("[thinfi] No password was sent, sending regular request...");
        resp = await axios({
          method: "GET",
          url: url,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate",
            "Connection": "keep-alive"
          },
          validateStatus: function(stat) {
            if (stat == 500 || stat == 200) return true;
          }
        });
      }

      if (lib.config().debug == true) console.log("[thinfi] Got page, parsing page...");
      let $ = cheerio.load(resp.data);
    
      if ($("body > main > section > p > a").length == 1) {
        return $("body > main > section > p > a").attr("href");
      } else {
        if (resp.data == "") throw "Thinfi has rate-limited us. Please try again in a moment.";
        else if ($("body > main > section > h2 > a").attr("href") == url) throw "Password is incorrect."
        throw "Thinfi has changed their website. Please update this extractor."
      }
    } catch(err) {
      throw err;
    }
  }
}