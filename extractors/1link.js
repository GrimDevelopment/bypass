const got = require("got");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: ["1link.club"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
      if (lib.config().debug == true) console.log("[1link] Requesting page...");
      
      let h = (lib.config().defaults?.got?.headers || lib.config().defaults?.axios?.headers || {});
      if (opt.referer) {
        h.Referer = opt.referer;
      }

      let proxy;
      if (lib.config().defaults?.got?.proxy) {
        if (lib.config().defaults?.got?.proxy?.type == "socks5") {
          const agent = require("socks-proxy-agent");
          let prox = `socks5://${lib.config().defaults?.got?.proxy?.host}:${lib.config().defaults?.got?.proxy?.port}`;
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
        headers: h,
        ...proxy
      });

      if (lib.config().debug == true) console.log("[1link] Got page. Parsing page...");
      let $ = cheerio.load(resp.body);

      if (lib.isUrl($("#download")[0]?.attribs?.href)) return $("#download")[0]?.attribs?.href;

      throw "Redirect not found.";
    } catch(err) {
      throw err;
    }
  }
}