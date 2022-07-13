const axios = require("axios");
const cheerio = require("cheerio");
const scp = require("set-cookie-parser");
const lib = require("../lib");

module.exports = {
  hostnames: ["ouo.press", "ouo.io"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
      if (lib.config().debug == true) console.log("[ouo] Requesting page...");
      let header = lib.config().defaults?.axios.headers;
      if (opt.referer) header.Referer = opt.referer;

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
        headers: header,
        ...proxy
      });

      if (lib.config().debug == true) console.log("[ouo] Got page, parsing page...");
      let $ = cheerio.load(resp.data);

      let post = $("form[method='POST']").attr("action");
      let tk = $("input[name='_token']").attr("value");
      let cookie = lib.cookieString(scp.parse(resp.headers["set-cookie"]));
      let body = `_token=${tk}&x-token=&v-token=bx`;

      if (lib.config().debug == true) console.log("[ouo] Done, preparing headers for next request...");
      header["Cookie"] = cookie;
      header["Content-Type"] = "application/x-www-form-urlencoded";
      header["Content-Length"] = lib.byteCount(body);
      header["Referer"] = url;
      header["Sec-Fetch-Dest"] = "document";
      header["Sec-Fetch-Mode"] = "navigate";
      header["Sec-Fetch-Site"] = "same-origin";
      header["TE"] = "trailers";

      if (lib.config().debug == true) console.log("[ouo] Done, sending request...");
      try {
        resp = await axios({
          method: "POST",
          data: body,
          url: post.replace("/go", "/xreallcygo"),
          headers: header,
          maxRedirects: 0,
          ...proxy
        });
        if (resp.data) {
          if (lib.config().debug == true) console.log("[ouo] CAPTCHA-less bypass failed, trying Puppeteer bypass...");
          return (await (require("./ouo.puppeteer").get(url, opt)));
        }
      } catch(err) {
        if (err.response?.headers?.location) return err.response.headers.location;
        else if (err.message.includes("status code")) {
          if (lib.config().debug == true) console.log("[ouo] CAPTCHA-less bypass failed, trying Puppeteer bypass...");
          return (await (require("./ouo.puppeteer").get(url, opt)));
        } else throw err;
      }

    } catch(err) {
      if (err.response) console.log(err.response)
      throw err;
    }
  }
}