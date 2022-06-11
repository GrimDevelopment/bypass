const axios = require("axios");
const cheerio = require("cheerio");

module.exports = {
  hostnames: ["bst.gg", "bst.wtf", "booo.st", "boost.ink"],
  "requires-captcha": false,
  get: async function(url) {
    try {
      let resp = await axios({
        method: "GET",
        url: url,
        headers: {
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });
  
      let $ = cheerio.load(resp.data);
  
      // below isn't necessary, really but it's future proofing the script.
      // it's going to look for the unlock script, get it and find the attribute that contains the script
  
      let attr;
      let scr;
  
      for (let a in $("script")) {
        if (typeof $("script")[a] == "object") {
          if ($("script")[a].attribs && $("script")[a].attribs.src && $("script")[a].attribs.src.includes("unlock")) {
            scr = $("script")[a].attribs;
            let b = (await axios(`https://boost.ink${$("script")[a].attribs.src}`)).data;
            attr = b.split(`dest=`)[1].split(`currentScript.getAttribute("`)[1].split(`"`)[0];
          }
        }
      }
  
      if (attr == undefined) throw "Boost.ink has updated their unlock script. Please update this script to accomodate for this.";
  
      return Buffer.from(scr[attr], "base64").toString("ascii");
    } catch(err) {
      throw err;
    }
  }
}