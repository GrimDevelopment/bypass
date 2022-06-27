const axios = require("axios");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: [],
  requireCaptcha: false,
  get: async function(url, opt) {
    if (lib.config().debug == true) console.log("[carrd] Requesting page...");

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
      ...proxy
    });

    if (lib.config().debug == true) console.log("[carrd] Got page, parsing...");
    let $ = cheerio.load(resp.data);
    let links = [];

    if (lib.config().debug == true) console.log("[carrd] Parsed. Filtering out unviewable links...");
    await ($("a").each(function(a) {
      let h = $("a")[a].attribs?.href;
      if (h !== null) {
        if (!h.startsWith("#") && !h.startsWith("/") && h !== "https://carrd.co/build?ref=auto") links.push(h);
      }
    }));

    return {destinations: links};
  }
}