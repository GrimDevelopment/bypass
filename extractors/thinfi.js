const got = require("got");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: ["thinfi.com"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
      let resp; 

      let h = (lib.config().defaults?.got?.headers || lib.config().defaults?.axios?.headers || {});
      if (opt.referer) {
        h.Referer = opt.referer;
      }

      let proxy;
      if (lib.config().defaults?.got?.proxy) {
        if (lib.config().defaults?.got?.proxy?.type == "socks5") {
          const agent = require("socks-proxy-agent");
          let prox = `socks5://${lib.config().defaults?.got?.proxy?.host}:${lib.config().defaults?.got?.proxy?.port}`;
          proxy = {httpsAgent: (new agent.SocksProxyAgent(prox))};
        } else {
          proxy = {};
        }
      }

      if (opt.password) {
        if (lib.config().debug == true) console.log("[thinfi] Password was sent in request, sending password request...");
        resp = await got({
          method: "POST",
          url: url,
          body: `password=${encodeURIComponent(opt.password)}`,
          headers: h,
          throwHttpErrors: false,
          ...proxy
        });
      } else {
        if (lib.config().debug == true) console.log("[thinfi] No password was sent, sending regular request...");
        resp = await got({
          method: "GET",
          url: url,
          headers: h,
          throwHttpErrors: false,
          ...proxy
        });
      }

      if (lib.config().debug == true) console.log("[thinfi] Got page, parsing page...");
      let $ = cheerio.load(resp.body);
    
      if ($("body > main > section > p > a").length == 1) {
        return $("body > main > section > p > a").attr("href");
      } else {
        if (resp.body == "") {
          if (lib.config().debug == true) console.log("[thinfi] Got rate-limited, waiting 6 seconds to retry...");
          await new Promise(resolve => setTimeout(resolve, 6000)); // waiting 6 seconds to retry...
          return (await this.get(url, opt));
        } else if ($("body > main > section > h2 > a").attr("href") == url) {
          console.log(resp)
          throw "Password is incorrect."
        }
        throw "Thinfi has changed their website. Please update this extractor."
      }
    } catch(err) {
      throw err;
    }
  }
}