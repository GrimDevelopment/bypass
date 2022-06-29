const axios = require("axios");
const cheerio = require("cheerio");
const scp = require("set-cookie-parser");
const lib = require("../lib");

module.exports = {
  hostnames: [],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
      if (lib.config().debug == true) console.log("[dlp] Requesting page...");
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

      if (lib.config().debug == true) console.log("[dlp] Got page. Parsing page...");
      let $ = cheerio.load(resp.data);

      let pw = $("#wrapper > #content > p").text().includes("Password");
      let b;

      if (lib.config().debug == true) console.log("[dlp] Parsed. Forming body data...");
      if (pw == true) {
        // passworded
        if (!opt.password) throw "Incorrect password.";
        b = `Pass1=${encodeURIComponent(opt.password)}&Submit0=Submit`;
      } else {
        if (lib.config().captcha.active == false) {
          throw "Normally this bypass wouldn't require a CAPTCHA, but it does in it's current state.";
        }
        let c = lib.cookieString(scp(resp.headers["set-cookie"]));
        header["Cookie"] = c;
        let cap = $("#wrapper > #content > form > p > img").attr("src");
        cap = await fetchCaptcha(cap, url, header);
        cap = await lib.solve(cap, "image");
        b = `security_code=${cap}&submit1=Submit`;
      }

      if (lib.config().debug == true) console.log("[dlp] Sending body data...");
      resp = await axios({
        method: "POST",
        url: url,
        data: b,
        headers: header
      });

      if (lib.config().debug == true) console.log("[dlp] Sent body data. Parsing response...");
      $ = cheerio.load(resp.data);
      let links = [];

      await ($("#wrapper > #content > center a").each(function(a) {
        let h = $("#wrapper > #content > center a")[a].attribs?.href;
        if (h !== null) {
          if (!h.startsWith("/")) links.push(h);
        }
      }));

      if (links.length == 0) {
        if ($(".error").length > 0) {
          throw $(".error").text();
        } else {
          throw "An unknown error has occured.";
        }
      } else if (links.length == 1) {
        return links[0];
      } else {
        return links;
      }
    } catch(err) {
      throw err;
    }
  }
}

async function fetchCaptcha(url, ref, h) {
  url = `${new URL(ref).protocol}//${new URL(ref).hostname}/${url}`;
  if (lib.config().debug == true) console.log("[dlp] Fetching CAPTCHA image...", url);
  
  h["Accept"] = "image/avif,image/webp,*/*";
  h["Accept-Encoding"] = "gzip, deflate";
  h["Connection"] = "keep-alive";
  h["Referer"] = ref;
  h["Sec-Fetch-Dest"] = "image";
  h["Sec-Fetch-Mode"] = "no-cors";
  h["Sec-Fetch-Site"] = "same-origin";
  h["TE"] = "Trailers";

  let resp = await axios({
    responseType: "arraybuffer",
    method: "GET",
    headers: h,
    url: url
  });

  if (lib.config().debug == true) console.log(`[dlp] Got CAPTCHA, content type `, resp.headers["content-type"]);

  return `data:${resp.headers["content-type"]};base64,${Buffer.from(resp.data).toString("base64")}`;
}