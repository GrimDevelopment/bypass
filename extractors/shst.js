const axios = require("axios");
const lib = require("../lib");

module.exports = {
  hostnames: [
    "sh.st", 
    "ceesty.com",
    "cestyy.com",
    "clkme.me",
    "clkmein.com", 
    "cllkme.com", 
    "corneey.com", 
    "destyy.com",  
    "festyy.com", 
    "gestyy.com", 
    "jnw0.me",
    "xiw34.com", 
    "wiid.me"
  ],
  requiresCaptcha: false,
  get: async function (url, opt) {
    try {
      if (lib.config().debug == true) console.log("[shst] Requesting page...");
      let resp = await axios({
        method: "GET",
        url: url,
        headers: {
          "user-agent": ""
        },
        maxRedirects: 1
      });
  
      if (lib.config().debug == true) console.log("[shst] Got page. Parsing Axios data...");
      if (resp.request?.socket?._httpMessage?._redirectable?._currentUrl !== url) {
        return resp.request.socket._httpMessage._redirectable._currentUrl;
      } else {
        throw "Redirect not found."
      }
    } catch(err) {
      throw err;
    }
  }
}