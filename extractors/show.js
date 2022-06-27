const axios = require("axios");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: ["show.co"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
      if (lib.config().debug == true) console.log("[show] Requesting page...");
      
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
        ...proxy
      });

      if (lib.config().debug == true) console.log("[show] Got page. Parsing page...");
      let $ = cheerio.load(resp.data);

      if ($("#show-campaign-data")) {
        if (lib.config().debug == true) console.log("[show] Parsed. Parsing JSON data...");
        let d = $("#show-campaign-data")[0]?.children[0]?.data;
        d = JSON.parse(d);
        if (lib.isUrl(d.unlockable?.redirect?.url)) {
          return d.unlockable.redirect.url;
        } else {
          if (lib.config().debug == true) console.log("[show] JSON data does not contain needed information.");
          throw "Redirect not found."
        }
      } else {
        if (lib.config().debug == true) console.log("[show] Page does not contain needed information.");
        throw "Redirect not found.";
      }
    } catch(err) {
      throw err;
    }
  }
}