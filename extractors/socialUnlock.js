const got = require("got");
const lib = require("../lib");

module.exports = {
  hostnames: ["social-unlock.com"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
      if (lib.config().debug == true) console.log("[social-unlock] Reformatting URL...");
      url = url.split("/").slice(0, 3).join("/") + "/redirect/" + url.split("/").slice(3).join("/");

      if (lib.config().debug == true) console.log("[social-unlock] Reformatted. Requesting page...");

      let h = (lib.config().defaults?.got.headers || lib.config().defaults?.axios.headers);
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
        followRedirect: false,
        ...proxy
      });

      if (lib.config().debug == true) console.log("[social-unlock] Got page. Parsing got data...");

      if (resp.headers?.location !== url) {
        return resp.headers?.location;
      } else {
        throw "Redirect not found."
      }
    } catch(err) {
      throw err;
    }
  }
}