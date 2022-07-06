const axios = require("axios");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: ["msha.ke"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
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
        
      if (lib.config().debug == true) console.log("[mshake] Requesting page...");

      let resp = await axios({
        method: "GET",
        url: url,
        headers: h,
        ...proxy
      });
      let urls = [];

      if (lib.config().debug == true) console.log("[mshake] Got page, parsing page...");

      let $ = cheerio.load(resp.data);
      $(".swiper > .swiper-wrapper > .swiper-slide a").each(function(i) {
        let ele = $(".swiper > .swiper-wrapper > .swiper-slide a")[i];
        let u = ele?.attribs.href;
        if (typeof u !== "string") return;

        if (u.startsWith("/")) u = `https://msha.ke${u}`;
        let p = new URL(u);
        if (p.hostname?.substring(p.hostname.length - 13, p.hostname.length) == "milkshake.app") return;
        if (p.pathname == "/cdn-cgi/l/email-protection") {
          u = `mailto:${lib.cloudflare.email(p.href)}`;
          p = new URL(u);
        }

        if (p.hostname == "msha.ke") return;
        urls.push(u);
      });

      if (lib.config().debug == true) console.log(`[mshake] Done. Returning ${urls.length} URLs...`);
      return {destinations: urls};
    } catch(err) {
      throw err;
    }
  }
}