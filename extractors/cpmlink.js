const got = require("got");
const cheerio = require("cheerio");
const scp = require("set-cookie-parser");
const lib = require("../lib");

module.exports = {
  hostnames: ["cpmlink.net"],
  requiresCaptcha: false,
  get: async function (url, opt) {
    try {
      if (lib.config().captcha.active == false) {
        throw "Captcha service is required for this link, but this instance doesn't support it."
      }

      if (lib.config().debug == true) console.log("[cpmlink] Requesting page...");

      let header = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive"
      }

      if (opt.referer) header.Referer = opt.referer;

      let proxy;
      if (lib.config().defaults?.got?.proxy) {
        if (lib.config().defaults?.got?.proxy?.type == "socks5") {
          const agent = require("socks-proxy-agent");
          try { 
            if ((new URL(prox).hostname == "localhost" || new URL(prox).hostname == "127.0.0.1") && new URL(proxy).port == "9050") {
              proxy = {};
            } else {
              proxy = {httpsAgent: (new agent.SocksProxyAgent(prox))};
            }
          } catch(err) {
            proxy = {};
          }
        } else {
          proxy = {};
        }
      }

      let resp = await got({
        method: "GET",
        url: url,
        headers: header,
        ...proxy
      });

      if (lib.config().debug == true) console.log("[cpmlink] Got page. Parsing page...");
      let $ = cheerio.load(resp.body);
      let k = $("#skip [name=key]").val();
      let t = $("#skip [name=time]").val();
      let r = $("#skip [name=ref]").val();
      let w = "960";
      let h = "927";
      let s = $("#captcha").attr("data-sitekey");
      let c = lib.cookieString(scp(resp.headers["set-cookie"]));

      if (lib.config().debug == true) console.log("[cpmlink] Parsed. Solving CAPTCHA...");
      let cap = await lib.solve(s, "recaptcha", {
        referer: url
      });
      if (lib.config().debug == true) console.log("[cpmlink] Solved CAPTCHA.");

      let body = `key=${k}&time=${t}&ref=${r}&s_width=${w}&s_height=${h}&g-recaptcha-response=${cap}`;

      if (lib.config().debug == true) console.log("[cpmlink] Requesting solve page...");
      resp = await got({
        method: "POST",
        body: body,
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
        },
        ...proxy
      });
      if (lib.config().debug == true) console.log("[cpmlink] Parsing solve page...");
      $ = cheerio.load(resp.body);
      return $("#continue a").attr("href");
    } catch(err) {
      throw err;
    }
  }
}