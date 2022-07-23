const got = require("got");
const lib = require("../lib");

module.exports = {
  hostnames: [
    "linkvertise.com",
    "linkvertise.net",
    "up-to-down.net",
    "link-to.net",
    "direct-link.net",
    "linkvertise.download",
    "file-link.net",
    "link-center.net",
    "link-target.net",
    "link-hub.net"
  ],
  requiresCaptcha: true,
  get: async function(url, opt) {
    try {
      let header = (lib.config().defaults.got.headers || lib.config().defaults.axios.headers || {});

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
  
      let id;
      if (new URL(url).hostname == "linkvertise.download") {
        id = new URL(url).pathname.split("/").slice(2, 4).join("/");
      } else {
        id = new URL(url).pathname.split("/").slice(1, 3).join("/");
      }
  
      if (lib.config().debug == true) console.log("[linkvertise] Got ID from URL:", id);
  
      header["User-Agent"] = "Mozilla/5.0 (iPhone; CPU iPhone OS 13_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1 Mobile/15E148 Safari/604.1";
      header.Accept = "application/json";
      header["Accept-Encoding"] = "gzip, deflate";
      header["Accept-Language"] = "en-US,en;q=0.5";
      header.Connection = "keep-alive";
      header.Origin = "https://linkvertise.com";
      header.Referer = "https://linkvertise.com/";
      header["Sec-Fetch-Dest"] = "empty";
      header["Sec-Fetch-Mode"] = "cors";
      header["Sec-Fetch-Site"] = "same-site";
      header["TE"] = "trailers";
  
      if (lib.config().debug == true) console.log("[linkvertise] Getting user token...");
  
      let resp = await got({
        method: "GET",
        headers: header,
        url: `https://publisher.linkvertise.com/api/v1/redirect/link/static/${id}?origin=&resolution=1920x960`
      });
  
      let type;
      if (resp.body?.data.link.target_type == "URL") {
        type = "target";
      } else if (resp.body?.data.link.target_type == "PASTE") {
        type = "paste";
      } else {
        throw "Unknown target type.";
      }
  
      let rp = resp.body?.data.link.id;
      let ut = resp.body?.user_token;
      if (lib.config().debug == true) console.log("[linkvertise] Got user token:", ut);
  
      let ck;
  
      if (lib.config().debug == true) console.log("[linkvertise] Doing CAPTCHA to validate traffic...");
  
      header["Content-Type"] = "application/json";
  
      if (new URL(url).hostname !== "linkvertise.com") url = `https://linkvertise.com/${url.split("/").slice(3).join("/")}`;
      let tk = await lib.solve("6LcEr_UUAAAAAHXt5wx-k9P_m8Z1JY-Ck9Mxrhxo", "recaptcha", {referer: url});
  
      let d = JSON.stringify({
        token: tk,
        type: "rc"
      });

      header["Content-Length"] = lib.byteCount(d);
        
      if (lib.config().debug == true) console.log("[linkvertise] Sending CAPTCHA result to get CAPTCHA token...");
      resp = await got({
        body: d,
        method: "POST",
        headers: header,
        url: `https://publisher.linkvertise.com/api/v1/redirect/link/${id}/traffic-validation?X-Linkvertise-UT=${ut}`        
      });

      ck = resp.body?.data.tokens.TARGET;
      if (lib.config().debug == true) console.log("[linkvertise] Got CAPTCHA token: ", ck);
  
      let fb = {};
  
      fb.serial = Buffer.from(JSON.stringify({
        timestamp: new Date() * 1,
        random: "6548307",
        link_id: rp
      })).toString("base64");
  
      if (ck !== undefined) fb.token = ck;
  
      fb = JSON.stringify(fb);
      header["Content-Type"] = "application/json";
      header["Content-Length"] = lib.byteCount(fb);
  
      if (lib.config().debug == true) console.log("[linkvertise] Sending final request...");
      resp = await got({
        body: fb,
        method: "POST",
        headers: header,
        url: `https://publisher.linkvertise.com/api/v1/redirect/link/${id}/${type}?X-Linkvertise-UT=${ut}`
      });
  
      return (resp.body?.data.paste || resp.body?.data.target);
    } catch(err) {
      if (err.code.toLowerCase().includes("econnreset") && opt.retried !== 1) {
        if (lib.config().debug == true) console.log("[linkvertise] Retrying request in 30 seconds, as it recieved a connection reset error...");
        await new Promise(resolve => setTimeout(resolve, 30000));
        opt.retried = 1;
        return (await this.get(url, opt)); 
      } else if (opt.retried == 1) {
        throw "Linkvertise has rate limited us, try again in a moment."
      }
      console.log(err.code)
      throw err;
    }
  }
}