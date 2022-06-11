const axios = require("axios");
const scp = require("set-cookie-parser");
const lib = require("../lib");

module.exports = {
  hostnames: ["cshort.org"],
  "requires-captcha": false,
  get: async function (url) {
    let resp = await axios({
      method: "GET",
      url: url,
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
      }
    });

    let r = resp.data.split(`function redirect() {`)[1].split(`}`)[0].split(`\n`);
    let h;
    let c = `${lib.cookieString(scp(resp.headers["set-cookie"]))}; aid=${encodeURIComponent(JSON.stringify([new URL(url).pathname.substring(1)]))}`;

    for (let a in r) {
      if (!r[a].startsWith("  //") && r[a] !== "") h = r[a].split(`?u=`)[1].split(`',`)[0];
    }

    if (h == undefined) throw "No redirects found.";

    await new Promise(resolve => setTimeout(resolve, 10000)); // can't bypass the wait, unfortunately

    resp = await axios({
      method: "GET",
      url: `${url}?u=${h}`,
      validateStatus: function() {
        return true;
      },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Cookie": c,
        "DNT": "1",
        "Connection": "keep-alive",
        "Referer": "https://cshort.org",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "cross-site",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1"
      }
    })

    if (resp.request.socket._httpMessage._redirectable._currentUrl !== url) {
      return resp.request.socket._httpMessage._redirectable._currentUrl;
    } else {
      throw "Redirect didn't occur when it was supposed to.";
    }
  }
}