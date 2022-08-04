const got = require("got");
const lib = require("../lib");

module.exports = {
  hostnames: ["letsboost.net"],
  requiresCaptcha: false,
  get: async function (url, opt) {
    try {
      if (lib.config.debug == true) console.log("[letsboost] Requesting page...");
      let header = (lib.config.defaults?.got?.headers || lib.config.defaults?.axios?.headers || {});
      if (opt.referer) header.Referer = opt.referer;

      let proxy;
      if (lib.config.defaults?.got?.proxy) {
        if (lib.config.defaults?.got?.proxy?.type == "socks5") {
          const agent = require("socks-proxy-agent");
          let prox = `socks5://${config.defaults?.got?.proxy?.host}:${config.defaults?.got?.proxy?.port}`;
          proxy = {httpsAgent: (new agent.SocksProxyAgent(prox))};
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

      if (lib.config.debug == true) console.log("[letsboost] Parsing page...");
      let json = resp.body.split("stepDat = '")[1].split("';")[0];
      json = JSON.parse(json);
      json = json[json.length - 1];
      json = json.url;
      return json;
    } catch(err) {
      throw err;
    }
  }
}