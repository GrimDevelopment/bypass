const got = require("got");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: ["mboost.me"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
      if (lib.config().debug == true) console.log("[mboost] Requesting page...");
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

      let $ = cheerio.load(resp.body);
      if (lib.config().debug == true) console.log("[mboost] Got page. Parsing page...");

      if ($("#__NEXT_DATA__")) {
        if (lib.config().debug == true) console.log(`[mboost] Parsed page. Parsing JSON "__NEXT_DATA__" information...`);
        let d = $("#__NEXT_DATA__")[0]?.children[0]?.data;
        d = JSON.parse(d);
        if (lib.config().debug == true) console.log("[mboost] Parsed JSON. Retrieving URL...");
        if (lib.isUrl(d.props?.initialProps?.pageProps?.data?.targeturl)) {
          return d.props?.initialProps?.pageProps?.data?.targeturl;
        }
        throw "Redirect not found.";
      } else {
        throw "Redirect not found.";
      }
    } catch(err) {
      throw err;
    }
  }
}
