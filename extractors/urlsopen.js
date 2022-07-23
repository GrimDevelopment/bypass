const got = require("got");
const lib = require("../lib");

module.exports = {
  hostnames: ["shorturllink.in", "urlsopen.com", "blog.textpage.xyz", "short.url2go.in"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
      if (new URL(url).hostname !== "short.url2go.in") {
        if (lib.config().debug == true) console.log("[urlsopen] Converting URL to final form...");
        if (new URL(url).hostname == "urlsopen.com") url = `https://short.url2go.in/${url.split("/").slice(3).join("/")}`;
        else if (new URL(url).hostname == "blog.textpage.xyz" && new URL(url).search !== "" && new URL(url).search !== undefined) {
          url = `https://short.url2go.in/${new URL(url).search.split("?")[1].split("=")[1].split("&")[0]}`;
        }
        if (lib.config().debug == true) console.log("[urlsopen] Converted to", url);
      }
  
      let h = (lib.config().defaults?.got?.headers || lib.config().defaults?.axios?.headers || {});
  
      if (lib.config().debug == true) console.log("[urlsopen] Requesting final page...");
      let resp = await got({
        method: "GET",
        headers: h,
        url: url
      });
  
      if (lib.config().debug == true) console.log("[urlsopen] Parsing final page...");
      if (resp.body.split(`playit://playerv2/video?url=`).length > 1) {
        return decodeURIComponent(resp.body.split(`playit://playerv2/video?url=`)[1].split(`'>`)[0]);
      } else {
        throw "Unable to find link.";
      }
    } catch(err) {
      throw err;
    }
  }
}