const axios = require("axios");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: [],
  get: async function(url) {
    let u = new URL(url);

    if (u.host == "href.li" || u.host == "www.href.li") return u.href.split("?").slice(1).join("?");

    // redirect via url params
    if (u.searchParams.get("url")) {
      if (lib.isUrl(u.searchParams.get("url"))) {
        return u.searchParams.get("url");
      } else if (lib.isUrl(Buffer.from(u.searchParams.get("url"), "base64").toString("ascii"))) {
        return lib.isUrl(Buffer.from(u.searchParams.get("url"), "base64").toString("ascii")); 
      }
    } else if (u.hash) {
      if (lib.isUrl(u.hash.substring(1))) {
        return u.hash.substring(1);
      } else if (lib.isUrl(Buffer.from(u.hash.substring(1), "base64").toString("ascii"))) {
        return (lib.isUrl(Buffer.from(u.hash.substring(1), "base64").toString("ascii")));
      }
    } else if (u.searchParams.get("target")) {
      if (lib.isUrl(u.searchParams.get("target"))) {
        return u.searchParams.get("target");
      } else if (lib.isUrl(Buffer.from(u.searchParams.get("target"), "base64").toString("ascii"))) {
        return (lib.isUrl(Buffer.from(u.searchParams.get("target"), "base64").toString("ascii")));
      }
    } else if (u.searchParams.get("href")) {
      if (lib.isUrl(u.searchParams.get("href"))) {
        return u.searchParams.get("href");
      } else if (lib.isUrl(Buffer.from(u.searchParams.get("href"), "base64").toString("ascii"))) {
        return (lib.isUrl(Buffer.from(u.searchParams.get("href"), "base64").toString("ascii")));
      }
    }

    let resp = await axios({
      method: "GET",
      url: url,
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    // adf.ly detection
    // i don't remember the origin of this script unfortunately so uh can't credit this
    if (resp.data.includes(`var ysmm = `)) {
      let a, m, I = "",
        X = "",
      r = resp.data.split(`var ysmm = `)[1].split('\'')[1];
      for (m = 0; m < r.length; m++) {
        if (m % 2 == 0) {
          I += r.charAt(m);
        } else {
          X = r.charAt(m) + X;
        }
      }
      r = I + X;
      a = r.split("");
      for (m = 0; m < a.length; m++) {
        if (!isNaN(a[m])) {
          for (var R = m + 1; R < a.length; R++) {
            if (!isNaN(a[R])) {
              let S = a[m] ^ a[R]
              if (S < 10) {
                a[m] = S
              }
              m = R
              R = a.length
            }
          }
        }
      }
      r = a.join("")
      r = Buffer.from(r, "base64").toString("ascii");
      r = r.substring(r.length - (r.length - 16));
      r = r.substring(0, r.length - 16);
      
      if (new URL(r).search.includes("dest=")) {
        r = decodeURIComponent(r.split("dest=")[1]);
      }

      return r;
    }

    // generic redirect
    if (resp.data.includes(`content="0;URL=`)) {
      return resp.data.split(`content="0;URL=`)[1].split(`"`)[0];
    }

    let $ = cheerio.load(resp.data);

    // wpsafe-link protectors
    if ($("#wpsafe-link").length !== 0) {
      if ($("#wpsafe-link a").attr("href") && $("#wpsafe-link a").attr("href").includes("safelink_redirect")) {
        let o = new URL($("#wpsafe-link a").attr("href"));
        o = o.searchParams.get("safelink_redirect");
        o = Buffer.from(o, "base64").toString("ascii");
        o = JSON.parse(o);
        o = decodeURIComponent(o.safelink);
        return o;
      }
    }

    if (resp.request.socket._httpMessage._redirectable._currentUrl !== url) {
      return resp.request.socket._httpMessage._redirectable._currentUrl;
    } 
  }
}