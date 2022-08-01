const got = require("got");
const lib = require("../lib");

module.exports = {
  hostnames: [
    "sh.st", 
    "ceesty.com",
    "cestyy.com",
    "clkme.me",
    "clkmein.com", 
    "cllkme.com", 
    "corneey.com", 
    "destyy.com",  
    "festyy.com", 
    "gestyy.com", 
    "jnw0.me",
    "xiw34.com", 
    "wiid.me"
  ],
  requiresCaptcha: false,
  get: async function (url, opt) {
    try {
      if (lib.config.debug == true) console.log("[shst] Requesting page...");

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
        headers: {
          "user-agent": ""
        },
        followRedirect: false,
        ...proxy
      });
  
      if (lib.config.debug == true) console.log("[shst] Got page. Parsing got data...");
      if (resp.headers?.location !== url) {
        return resp.headers.location;
      } else {
        throw "Redirect not found."
      }
    } catch(err) {
      throw err;
    }
  }
}