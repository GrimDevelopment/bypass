const got = require("got");
const scp = require("set-cookie-parser");
const lib = require("../lib");

module.exports = {
  hostnames: ["cshort.org"],
  requiresCaptcha: false,
  get: async function (url, opt) {
    try {
      if (lib.config().debug == true) console.log("[cshort] Requesting page...");

      let header =  {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
      };
      if (opt.referer) header.Referer = opt.referer;

      let proxy;
      if (lib.config().defaults?.got?.proxy) {
        if (lib.config().defaults?.got?.proxy?.type == "socks5") {
          const agent = require("socks-proxy-agent");
          try { 
            if ((new URL(prox).hostname == "localhost" || new URL(prox).hostname == "127.0.0.1") && new URL(proxy).port == "9050") {
              proxy = {};
            } else {
              proxy = {httpsAgent: (new agent.SocksProxyAgent(prox))};
            }
          } catch(err) {
            proxy = {};
          }
        } else {
          proxy = {};
        }
      }

      let resp = await got({
        method: "GET",
        url: url,
        headers: header,
        timeout: (10 * 1000),
        ...proxy
      });
  
      if (lib.config().debug == true) console.log("[cshort] Getting next page URL (1/2)...");
      let r = resp.body.split(`function redirect() {`)[1].split(`}`)[0].split(`\n`);
      let h;
      let c = `${lib.cookieString(scp(resp.headers["set-cookie"]))}; aid=${encodeURIComponent(JSON.stringify([new URL(url).pathname.substring(1)]))}`;
  
      if (lib.config().debug == true) console.log("[cshort] Getting next page URL (2/2)...");
      for (let a in r) {
        if (!r[a].startsWith("  //") && r[a] !== "") h = r[a].split(`?u=`)[1].split(`',`)[0];
      }
  
      if (h == undefined) throw "No redirects found.";

      if (lib.config().debug == true) console.log("[cshort] Counting down...");
      await new Promise(resolve => setTimeout(resolve, 10000)); // can't bypass the wait, unfortunately
  
      if (lib.config().debug == true) console.log("[cshort] Requesting next page URL...");
      resp = await got({
        method: "GET",
        throwHttpErrors: false,
        followRedirect: false,
        url: `${url}?u=${h}`,
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
        },
        timeout: (10 * 1000)
      });
  
      if (resp?.headers?.location !== url) {
        return resp.headers.location;
      } else {
        throw "Redirect didn't occur when it was supposed to.";
      }
    } catch(err) {
      throw err;
    }
  }
}