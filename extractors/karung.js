const got = require("got");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: ["karung.in"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
      let header = (lib.config().defaults.got.headers || lib.config().defaults.axios.headers || {});
      if (opt.referer) header.Referer = opt.referer; 

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

      if (lib.config().debug == true) console.log("[karung] Requesting page...");
      let resp = await got({
        method: "GET",
        url: url,
        headers: header,
        ...proxy
      });
      
      if (lib.config().debug == true) console.log("[karung] Got page. Parsing page...");

      let $ = cheerio.load(resp.body);
      let r = $("#makingdifferenttimer")[0]?.attribs?.href;
      if (lib.config().debug == true) console.log("[karung] Parsed. Decoding data...");
      r = new URL(r);
      r = r.searchParams.get("r");
      r = Buffer.from(r, "base64").toString("ascii");
      return r;
    } catch(err) {
      throw err;
    }
  }
}