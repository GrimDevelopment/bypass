const axios = require("axios");

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
  "requires-captcha": false,
  get: async function (url) {
    try {
      let resp = await axios({
        method: "GET",
        url: url,
        headers: {
          "user-agent": ""
        }
      });
  
      if (resp.request.socket._httpMessage._redirectable._currentUrl !== url) {
        return resp.request.socket._httpMessage._redirectable._currentUrl;
      } else {
        throw "Normal redirect no longer works."
      }
    } catch(err) {
      throw err;
    }
  }
}