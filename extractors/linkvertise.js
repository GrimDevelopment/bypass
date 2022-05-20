const axios = require("axios");

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
    "link-target.net"
  ],
  get: async function (url) {
    let u = new URL(url);
    let i;
    if (u.hostname == "linkvertise.download") {
      i = `/${u.pathname.split("/").slice(2, 4).join("/")}`;
    } else {
      i = `${u.pathname.split("/").slice(0, 3).join("/")}`;
    }
    
    let resp = await axios({
      method: "GET",
      url: `https://publisher.linkvertise.com/api/v1/redirect/link/static${i}?origin=&resolution=1920x1080`,
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",           
        "Accept-Encoding": "gzip, deflate",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-GPC": "1",
        "Cache-Control": "max-age=0",
        "TE": "Trailers"
      }
    });

    if (resp.headers["content-type"] == "text/html; charset=UTF-8") throw "Invalid type of link.";

    console.log(resp.data)

    let serial = Buffer.from(JSON.stringify({
      timestamp: new Date() * 1,
      random: "6548307",
      link_id: resp.data.data.link.id
    })).toString("base64");
    
    switch (resp.data.data.link.target_type.toLowerCase()) {
      //tba
    }
  }
}