const got = require("got");
const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = {
  hostnames: [],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
      let u = new URL(url);

      if (u.host == "href.li" || u.host == "www.href.li") return u.href.split("?").slice(1).join("?");

      if (u.host.substring(u.host.length - 8) == "carrd.co" && u.host !== "carrd.co") {
        let carrd = require("./carrd");
        return (await carrd.get(url));
      }

      // redirect via url params
      if (lib.config().debug == true) console.log("[generic] Checking url params..."); 
      if (u.searchParams.get("url")) {
        if (lib.isUrl(u.searchParams.get("url"))) {
          return u.searchParams.get("url");
        } else if (lib.isUrl(Buffer.from(u.searchParams.get("url"), "base64").toString("ascii"))) {
          return Buffer.from(u.searchParams.get("url"), "base64").toString("ascii"); 
        }
      } else if (u.hash) {
        if (lib.isUrl(u.hash.substring(1))) {
          return u.hash.substring(1);
        } else if (lib.isUrl(Buffer.from(u.hash.substring(1), "base64").toString("ascii"))) {
          return (Buffer.from(u.hash.substring(1), "base64").toString("ascii"));
        }
      } else if (u.searchParams.get("target")) {
        if (lib.isUrl(u.searchParams.get("target"))) {
          return u.searchParams.get("target");
        } else if (lib.isUrl(Buffer.from(u.searchParams.get("target"), "base64").toString("ascii"))) {
          return (Buffer.from(u.searchParams.get("target"), "base64").toString("ascii"));
        }
      } else if (u.searchParams.get("href")) {
        if (lib.isUrl(u.searchParams.get("href"))) {
          return u.searchParams.get("href");
        } else if (lib.isUrl(Buffer.from(u.searchParams.get("href"), "base64").toString("ascii"))) {
          return (Buffer.from(u.searchParams.get("href"), "base64").toString("ascii"));
        }
      } else if (u.searchParams.get("site")) {
        if (lib.isUrl(u.searchParams.get("site"))) {
          return u.searchParams.get("site");
        } else if (lib.isUrl(Buffer.from(u.searchParams.get("site"), "base64").toString("ascii"))) {
          return (Buffer.from(u.searchParams.get("site"), "base64").toString("ascii"));
        }
      } else if (u.searchParams.get("r")) {
        if (lib.isUrl(u.searchParams.get("r"))) {
          return u.searchParams.get("r");
        } else if (lib.isUrl(Buffer.from(u.searchParams.get("r"), "base64").toString("ascii"))) {
          return (Buffer.from(u.searchParams.get("r"), "base64").toString("ascii"));
        }
      } else if (u.searchParams.get("q")) {
        if (lib.isUrl(u.searchParams.get("q"))) {
          return u.searchParams.get("q");
        } else if (lib.isUrl(Buffer.from(u.searchParams.get("q"), "base64").toString("ascii"))) {
          return (Buffer.from(u.searchParams.get("q"), "base64").toString("ascii"));
        }
      } else if (u.searchParams.get("k")) {
        if (lib.isUrl(u.searchParams.get("k"))) {
          return u.searchParams.get("k");
        } else if (lib.isUrl(Buffer.from(u.searchParams.get("k"), "base64").toString("ascii"))) {
          return (Buffer.from(u.searchParams.get("k"), "base64").toString("ascii"));
        }
      } else if (u.searchParams.get("file")) {
        if (lib.isUrl(u.searchParams.get("file"))) {
          return u.searchParams.get("file");
        } else if (lib.isUrl(Buffer.from(u.searchParams.get("file"), "base64").toString("ascii"))) {
          return (Buffer.from(u.searchParams.get("file"), "base64").toString("ascii"));
        }
      }

      if (lib.config().debug == true) console.log("[generic] Requesting page...");
      let header = (lib.config().defaults?.got?.headers || lib.config().defaults?.axios?.headers || {});
      if (opt.referer) header.Referer = opt.referer;

      let proxy;
      if (lib.config().defaults?.got?.proxy) {
        if (lib.config().defaults?.got?.proxy?.type == "socks5") {
          const agent = require("socks-proxy-agent");
          let prox = `socks5://${lib.config().defaults?.got?.proxy?.host}:${lib.config().defaults?.got?.proxy?.port}`;
          proxy = {httpsAgent: (new agent.SocksProxyAgent(prox))};
        } else {
          proxy = {};
        }
      }

      let resp = await got({
        method: "GET",
        url: url,
        headers: header,
        throwHttpErrors: false,
        followRedirect: false,
        ...proxy
      });

      // adf.ly detection
      // i don't remember the origin of this script unfortunately so uh can't credit this
      if (lib.config().debug == true) console.log("[generic] Got page. Checking for indicators that this is an adf.ly link..."); 
      if (resp.body.includes(`var ysmm = `)) {
        let a, m, I = "",
          X = "",
        r = resp.body.split(`var ysmm = `)[1].split('\'')[1];
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

      // generic HTML redirect
      if (lib.config().debug == true) console.log("[generic] Done. Checking for HTML redirects..."); 
      if (resp.body.includes(`content="0;URL=`)) {
        return resp.body.split(`content="0;URL=`)[1].split(`"`)[0];
      }

      // generic countdown sites
      if (lib.config().debug == true) console.log("[generic] Done. Checking for general countdown sites...");
      if (resp.body.split("$('.skip-btn').attr('href','").length > 1) {
        return resp.body.split("$('.skip-btn').attr('href','")[1].split("')")[0];
      }

      // generic HTTP redirects, put any non-specific (like adlinkfly-type extractors) sites below this
      if (lib.config().debug == true) console.log("[generic] Done. Checking for HTTP redirects...");
      if (resp.headers?.location == undefined) {
        if (lib.isUrl(resp.headers?.location)) {
          return resp.headers?.location;
        } else if (resp.headers?.location?.startsWith("/")) {
          return `${url.split("/").slice(0, 3)}${resp.headers?.location}`;
        }
      }

      // HTTP redirects, volume 2
      if (resp.headers.refresh) {
        if (lib.isUrl(resp.headers.refresh.split("; url=").slice(1).join("; url="))) {
          return resp.headers.refresh.split("; url=").slice(1).join("; url=");
        } else if (resp.headers.refresh.startsWith("/")) {
          return `${url.split("/").slice(0, 3)}${resp.headers.refresh.slice(1).join("; url=")}`;
        }
      }

      let $ = cheerio.load(resp.body);

      // wpsafe-link protectors
      if (lib.config().debug == true) console.log("[generic] Done. Checking for wpsafelink indicators..."); 
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

      // adlinkfly sites
      if (lib.config().debug == true) console.log("[generic] Done. Checking if link is adlinkfly link...");
      if ($("form > div[style='display:none;'] > *[name='_method']").length > 0 || $("form[action='https://techydino.net/golink.php']").length > 0) {
        if (lib.config().debug == true) console.log("[generic] Link is an adlinkfly link, switching to adlinkfly extractor...");
        const afl = require("./adlinkfly"); 
        return (await afl.get(url, opt));
      }

      // daddy's link protector
      if (lib.config().debug == true) console.log("[generic] Done. Checking if link is DLP link...");
      if ($("#wrapper > #footer > center a[target='_blank'][href='http://www.daddyscripts.com']").length > 0) {
        if (lib.config().debug == true) console.log("[generic] Link is an DLP link, switching to DLP extractor...");
        const dlp = require("./dlp"); 
        return (await dlp.get(url, opt));
      }

      if (lib.config().debug == true) console.log("[generic] Done. Checking for a long WPSafelink bypass...");
      if ($("body > form#landing").length == 1) {
        if (lib.config().debug == true) console.log("[generic] Link is a long WPSafelink, switching to WPSafelink extractor...");
        const lwps = require("./longwpsafe"); 
        return (await lwps.get(url, opt));
      }

      throw "Redirect not found.";
    } catch(err) {
      throw err;
    }
  }
}