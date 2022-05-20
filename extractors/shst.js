const axios = require("axios");

module.exports = {
  hostnames: ["sh.st", "clkmein.com", "viid.me", "xiw34.com", "corneey.com", "gestyy.com", "cllkme.com", "festyy.com", "destyy.com", "cestyy.com", "ceesty.com"],
  get: async function (url) {
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
  }
}