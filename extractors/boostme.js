const got = require("got");
const cheerio = require("cheerio");
const config = require("../config.json")
const lib = require("../lib");

module.exports = {
  hostnames: ["boostme.link", "boost.fusedgt.com"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
      if (lib.config.debug == true) console.log("[boostme] Requesting page...");
      let h = (lib.config.defaults?.got?.headers || lib.config.defaults?.axios?.headers || {});
      if (opt.referer) {
        h.Referer = opt.referer;
      }
      
      let proxy;
      if (lib.config.defaults?.got?.proxy) {
        if (lib.config.defaults?.got?.proxy?.type == "socks5") {
          const agent = require("socks-proxy-agent");
          let prox = `socks5://${config.defaults?.got?.proxy?.host}:${config.defaults?.got?.proxy?.port}`;
          if ((new URL(prox).hostname == "localhost" || new URL(prox).hostname == "127.0.0.1") && new URL(prox).port == "9050") {
            proxy = {};
          } else {
            proxy = {httpsAgent: (new agent.SocksProxyAgent(prox))};
          }
        } else {
          proxy = {};
        }
      }

      let resp = await got({
        method: "GET",
        url: url,
        headers: h,
        ...proxy,
        throwHttpErrors: false,
      });
  
      let $ = cheerio.load(resp.body);
      if (lib.config.debug == true) console.log("[boostme] Got page. Decoding page...");
      if (!$(".main #home").attr("data-url")) {
        console.log(resp.body)
        throw "Boostme.link bypass has changed or we have been rate limited. If you are the owner of this instance, please dump the terminal contents into an issue on the repo.";
      } else {  
        return Buffer.from($(".main #home").attr("data-url"), "base64").toString("ascii");
      }
    } catch(err) {
      throw err;
    }
  }
}

//async function resolve