const axios = require("axios");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: ["thinfi.com"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
      let resp; 

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

      if (opt.password) {
        if (lib.config().debug == true) console.log("[thinfi] Password was sent in request, sending password request...");
        resp = await axios({
          method: "POST",
          url: url,
          data: `password=${encodeURIComponent(opt.password)}`,
          headers: h,
          validateStatus: function(stat) {
            if (stat == 500 || stat == 200) return true;
          },
          ...proxy
        });
      } else {
        if (lib.config().debug == true) console.log("[thinfi] No password was sent, sending regular request...");
        resp = await axios({
          method: "GET",
          url: url,
          headers: h,
          validateStatus: function(stat) {
            if (stat == 500 || stat == 200) return true;
          },
          ...proxy
        });
      }

      if (lib.config().debug == true) console.log("[thinfi] Got page, parsing page...");
      let $ = cheerio.load(resp.data);
    
      if ($("body > main > section > p > a").length == 1) {
        return $("body > main > section > p > a").attr("href");
      } else {
        if (resp.data == "") throw "Thinfi has rate-limited us. Please try again in a moment.";
        else if ($("body > main > section > h2 > a").attr("href") == url) throw "Password is incorrect."
        throw "Thinfi has changed their website. Please update this extractor."
      }
    } catch(err) {
      throw err;
    }
  }
}