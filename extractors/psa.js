const axios = require("axios");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: ["psa.pm"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    let u = new URL(url).pathname.split("/")[1];
    if (u !== "exit") throw "Invalid psa.pm link.";

    if (lib.config().debug == true) console.log("[psa] Requesting page...");
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

    if (lib.config().debug == true) console.log("[psa] Done. Parsing page...");
    let $ = cheerio.load(resp.data);
    return $("form")?.attr("action");
  }
}