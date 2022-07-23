const got = require("got");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: ["bst.gg", "bst.wtf", "booo.st", "boost.ink"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
      let h = (lib.config().defaults?.got.headers || lib.config().defaults?.axios.headers);
      if (opt.referer) {
        h.Referer = opt.referer;
      }

      let proxy;
      if (lib.config().defaults?.got.proxy) {
        if (lib.config().defaults?.got.proxy?.type == "socks5") {
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

      if (lib.config().debug == true) console.log("[boost] Requesting page...");
      let resp = await got({
        method: "GET",
        url: url,
        headers: h,
        ...proxy
      });
  
      let $ = cheerio.load(resp.body);
  
      // below isn't necessary, really but it's future proofing the script.
      // it's going to look for the unlock script, get it and find the attribute that contains the script
  
      let attr;
      let scr;
      
      if (lib.config().debug == true) console.log("[boost] Got page. Scanning scripts...");
      for (let a in $("script")) {
        if (typeof $("script")[a] == "object") {
          if ($("script")[a].attribs && $("script")[a].attribs.src && $("script")[a].attribs.src.includes("unlock")) {
            scr = $("script")[a].attribs;
            if (lib.config().debug == true) console.log("[boost] Found unlock.js script. Requesting...");
            let b = (await got(
              {
                url: `https://boost.ink${scr["src"]}`, 
                ...proxy
              }
            )).body;
            if (lib.config().debug == true) console.log("[boost] Got script. Searching for attribute needed to decode...");
            attr = b.split(`dest=`)[1].split(`currentScript.getAttribute("`)[1].split(`"`)[0];
          }
        }
      }
  
      if (attr == undefined) throw "Boost.ink has updated their unlock script. Please update this script to accomodate for this.";
  
      if (lib.config().debug == true) console.log("[boost] Done. Decoding original page...");
      return Buffer.from(scr[attr], "base64").toString("ascii");
    } catch(err) {
      throw err;
    }
  }
}