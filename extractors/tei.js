const axios = require("axios");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: ["tei.ai", "tii.ai"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
      if (lib.config().debug == true) console.log("[teiai] Requesting page...");

      let h = lib.config().defaults?.axios.headers;
      if (opt.referer) {
        h.Referer = opt.referer;
      }

      let proxy;
      if (lib.config().defaults?.axios.proxy) {
        if (lib.config().defaults?.axios.proxy?.type == "socks5") {
          const agent = require("socks-proxy-agent");
          let prox = `socks5://${lib.config().defaults?.axios.proxy?.host}:${lib.config().defaults?.axios.proxy?.port}`;
          proxy = {httpsAgent: (new agent.SocksProxyAgent(prox))};
        } else {
          proxy = {};
        }
      }

      let resp = await axios({
        method: "GET",
        url: url,
        headers: h,
        validateStatus: function() {
          return true;
        },
        ...proxy
      });

      if (lib.config().debug == true) console.log("[teiai] Got page. Parsing page...");
      let $ = cheerio.load(resp.data);

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