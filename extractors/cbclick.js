const got = require("got");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: ["cb.click", "cb.run"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
      if (lib.config.debug == true) console.log("[cbclick] Requesting page...");
      let h = (lib.config.defaults?.got?.headers || lib.config.defaults?.axios?.headers || {});
      if (opt.referer) {
        h.Referer = opt.referer;
      }
      
      let proxy;
      if (lib.config.defaults?.got?.proxy) {
        if (lib.config.defaults?.got?.proxy?.type == "socks5") {
          const agent = require("socks-proxy-agent");
          let prox = `socks5://${config.defaults?.got?.proxy?.host}:${config.defaults?.got?.proxy?.port}`;
          if ((new URL(prox).hostname == "localhost" || new URL(prox).hostname == "127.0.0.1") && new URL(prox).port == "9050") {
            proxy = {};
          } else {
            proxy = {httpsAgent: (new agent.SocksProxyAgent(prox))};
          }
        } else {
          proxy = {};
        }
      }

      let resp = await got({
        method: "GET",
        url: url,
        headers: h,
        throwHttpErrors: false,
        ...proxy,
      });

      if (lib.config.debug == true) console.log("[cbclick] Done, parsing page...")
      let $ = cheerio.load(resp.body);
      let redirect = $(".cb-splash__btn > a.redirect")?.attr("href");
      return redirect;
    } catch(err) {
      throw err;
    }
  }
}