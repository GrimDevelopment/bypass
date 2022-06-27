const axios = require("axios");
const lib = require("../lib");

module.exports = {
  hostnames: ["social-unlock.com"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
      if (lib.config().debug == true) console.log("[social-unlock] Reformatting URL...");
      url = url.split("/").slice(0, 3).join("/") + "/redirect/" + url.split("/").slice(3).join("/");

      if (lib.config().debug == true) console.log("[social-unlock] Reformatted. Requesting page...");

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
        maxRedirects: 1,
        ...proxy
      });

      if (lib.config().debug == true) console.log("[social-unlock] Got page. Parsing Axios data...");
      if (resp.request?.socket?._httpMessage?._redirectable?._currentUrl !== url) {
        return resp.request.socket._httpMessage._redirectable._currentUrl;
      } else {
        throw "Redirect not found."
      }
    } catch(err) {
      throw err;
    }
  }
}