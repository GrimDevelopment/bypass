const got = require("got");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: ["olamovies.cfd", "olamovies.top"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
      let u = new URL(url)
      if (!u.pathname.startsWith("/download") || !u.searchParams.get("key") || !u.searchParams.get("id")) throw "Invalid olamovies link.";

      if (lib.config().debug == true) console.log("[ola] Requesting page...");
      let h = (lib.config().defaults.got.headers || lib.config().defaults.axios.headers || {});
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
        ...proxy
      });

      if (lib.config().debug == true) console.log("[ola] Got page, parsing page...");
      let $ = cheerio.load(resp.body);
      let d = $("#download > a").attr("href");

      if (d == "" || d == undefined) throw "Could not find destination in page." 

      return d;
    } catch(err) {
      throw err;
    }
  }
}