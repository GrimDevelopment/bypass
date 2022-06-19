const axios = require("axios");
const cheerio = require("cheerio");
const scp = require("set-cookie-parser");
const lib = require("../lib");

module.exports = {
  hostnames: ["cpmlink.net"],
  "requires-captcha": false,
  get: async function (url) {
    try {
      if (lib.config().captcha.active == false) {
        throw "Captcha service is required for this link, but this instance doesn't support it."
      }

      let resp = await axios({
        method: "GET",
        url: url,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate",
          "Connection": "keep-alive"
        }
      });

      let $ = cheerio.load(resp.data);
      let k = $("#skip [name=key]").val();
      let t = $("#skip [name=time]").val();
      let r = $("#skip [name=ref]").val();
      let w = "960";
      let h = "927";
      let s = $("#captcha").attr("data-sitekey");
      let c = lib.cookieString(scp(resp.headers["set-cookie"]));

      let cap = await lib.solve(s, "recaptcha", {
        referer: url
      });

      let body = `key=${k}&time=${t}&ref=${r}&s_width=${w}&s_height=${h}&g-recaptcha-response=${cap}`;

      resp = await axios({
        method: "POST",
        data: body,
        url: $("#skip").attr("action"),
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Length": lib.byteCount(body),
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie": c,
            "Origin": "https://cpmlink.net",
            "Pragma": "no-cache",
            "Referer": url,
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Site": "navigate",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1"
        }
      });
      $ = cheerio.load(resp.data);
      return $("#continue a").attr("href");
    } catch(err) {
      throw err;
    }
  }
}