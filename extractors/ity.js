const got = require("got");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: ["ity.im"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
      let header = (lib.config().defaults?.got?.headers || lib.config().defaults?.axios?.headers || {});
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

      if (lib.config().debug == true) console.log("[ityim] Requesting page...");
      let resp = await got({
        method: "GET",
        url: url,
        headers: header,
        ...proxy
      });
  
      if (lib.config().debug == true) console.log("[ityim] Got page. Parsing page...");
      let $ = cheerio.load(resp.body);
  
      return $(".col-xs-6.col-md-4.vertical_center:not(#logo_div) a").attr("href");
    } catch(err) {
      throw err;
    }
  }
}