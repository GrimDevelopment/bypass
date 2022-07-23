const got = require("got");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: ["tei.ai", "tii.ai"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
      if (lib.config().debug == true) console.log("[teiai] Requesting page...");

      let h = lib.config().defaults?.got.headers;
      if (opt.referer) {
        h.Referer = opt.referer;
      }

      let proxy;
      if (lib.config().defaults?.got.proxy) {
        if (lib.config().defaults?.got.proxy?.type == "socks5") {
          const agent = require("socks-proxy-agent");
          let prox = `socks5://${lib.config().defaults?.got.proxy?.host}:${lib.config().defaults?.got.proxy?.port}`;
          proxy = {httpsAgent: (new agent.SocksProxyAgent(prox))};
        } else {
          proxy = {};
        }
      }

      let resp = await got({
        method: "GET",
        url: url,
        headers: h,
        throwHttpErrors: false,
        ...proxy
      });

      if (lib.config().debug == true) console.log("[teiai] Got page. Parsing page...");
      let $ = cheerio.load(resp.body);

      if (lib.config().debug == true) console.log("[teiai] Parsed. Decoding token...");

      let token = $("#link-view form [name='token']")?.val()?.split("aHR")?.slice(1)?.join("aHR");
      token = `aHR${token}`;
      token = Buffer.from(token, "base64").toString();
      return token;
    } catch(err) {
      throw err;
    }
    
  }
}