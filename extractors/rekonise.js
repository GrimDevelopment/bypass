const got = require("got");
const lib = require("../lib");

module.exports = {
  hostnames: ["rekonise.com"],
  requiresCaptcha: false, 
  get: async function(url, opt) {
    try {
      let id = new URL(url).pathname;
      if (lib.config.debug == true) console.log("[rekonise] Requesting API...");


      let h = (lib.config.defaults?.got?.headers || lib.config.defaults?.axios?.headers || {});
      if (opt.referer) {
        h.Referer = opt.referer;
      }

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
        url: `https://api.rekonise.com/unlocks${id}`,
        headers: h,
        ...proxy
      });
      
      if (lib.config.debug == true) console.log("[rekonise] Got API content.");

      return resp?.data?.url;
    } catch(err) {
      throw err;
    }
  }
}