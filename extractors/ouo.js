const axios = require("axios");
const cheerio = require("cheerio");
const scp = require("set-cookie-parser");
const lib = require("../lib");

module.exports = {
  hostnames: ["ouo.press", "ouo.io"],
  get: async function(url) {
    let u = new URL(url);
    if (u.searchParams.get("s")) return decodeURIComponent(u.searchParams.get("s"));
    let r = await axios({
      method: "GET",
      url: url,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
      }
    });
    let $ = cheerio.load(r.data);
    let c = lib.cookieString(scp(r.headers["set-cookie"]));
    console.log(c);
    let sk;
    for (let d in $("head script")) {
      if ($("head script")[d].attribs && $("head script")[d].attribs.src && $("head script")[d].attribs.src.includes("?render")) {
        sk = new URL($("head script")[d].attribs.src).searchParams.get("render")
      } else {
        continue;
      }
    }
    if (sk == null) throw "No sitekey for Captcha found";
    let cap = await lib.solve(sk, "recaptcha", {referer: url});
    let b = `_token=${encodeURIComponent($("#form-captcha [name=_token]").val())}&x-token=${cap}&v-token=${$("#v-token").val()}`;
    console.log(b);
    console.log($("#form-captcha").attr("action"))
    r = await axios({
      method: "POST",
      body: b,
      url: $("#form-captcha").attr("action"),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        "Cache-Control": "no-cache",
        "Referer": url,
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": lib.byteCount(b),
        "Origin": u.hostname,
        "DNT": "1",
        "Connection": "keep-alive",
        "Cookie": c,
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-GPC": "1",
        "TE": "Trailers"
      }
    });
    console.log(r.data);
  }
}

