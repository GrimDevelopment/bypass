const got = require("got");
const lib = require("../lib");

module.exports = {
  hostnames: ["linktr.ee"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    try {
      if (lib.config().debug == true) console.log(`[linktree] Requesting page...`);
      let h = (lib.config().defaults.got.headers || lib.config().defaults.axios.headers || {});
      if (opt.referer) {
        h.Referer = opt.referer;
      }

      let proxy;
      if (lib.config().defaults?.got.proxy) {
        if (lib.config().defaults?.got.proxy?.type == "socks5") {
          const agent = require("socks-proxy-agent");
          let prox = `socks5://${lib.config().defaults?.got.proxy?.host}:${lib.config().defaults?.got.proxy?.port}`;
          proxy = {httpsAgent: (new agent.SocksProxyAgent(prox))};
        } else {
          proxy = {};
        }
      }
      
      let resp = await got({
        method: "GET",
        url: url,
        headers: h,
        ...proxy
      });

      if (lib.config().debug == true) console.log(`[linktree] Got page. Finding and parsing "__NEXT_DATA__"...`);
      let l = [];
      let j = resp.body.split(`<script id="__NEXT_DATA__" type="application/json" crossorigin="anonymous">`)[1]?.split(`</script>`)[0];
      if (j == null) throw `Couldn't find "__NEXT_DATA__"`;
      j = JSON.parse(j);
      if (j == null) throw `Couldn't parse "__NEXT_DATA__"`;

      if (lib.config().debug == true) console.log(`[linktree] Found and parsed. Filtering and removing gates from first batch of links...`);
      for (let a in j.props?.pageProps?.links) {
        if (j.props.pageProps.links[a].url) {
          l.push(j.props.pageProps.links[a].url);
        } else {
          l.push(await deAge(j.props.pageProps.links[a].id, j.props.pageProps.account?.id, url));
        }
      }

      if (lib.config().debug == true) console.log(`[linktree] Done. Filtering and removing gates from second batch of links...`);
      for (let a in j.props?.pageProps?.socialLinks) {
        if (j.props.pageProps.socialLinks[a].url) {
          l.push(j.props.pageProps.socialLinks[a].url);
        } else {
          l.push((await deAge(j.props.pageProps.socialLinks[a].id, j.props.pageProps.account?.id, url)))
        }
      }
    
      console.log(l);
      return {destinations: l};
    } catch(err) {
      throw err;
    }
  }
}

async function deAge(linkId, accountId, url) {
  if (lib.config().debug == true) console.log(`[linktree] Requesting link id ${linkId} (was age-gated).`);

  let data = JSON.stringify({
    accountId: accountId,
    requestSource: { referer: null },
    validationInput: { acceptedSensitiveContent: (parseInt(linkId) || linkId)}
  });

  let resp = await got({
    method: "POST",
    url: "https://linktr.ee/api/profiles/validation/gates",
    body: data,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br",
      "Content-Type": "application/json",
      "DNT": "1",
      "Origin": "https://linktr.ee",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "no-cors",
      "Sec-Fetch-Site": "same-origin",
      "Connection": "keep-alive",
      "Pragma": "no-cache",
      "Sec-GPC": "1",
      "Referer": url,
      "Upgrade-Insecure-Requests": "1"
    }
  });

  if (lib.config().debug == true) console.log(`[linktree] Parsed link id ${linkId} as "${resp.body.links[0].url}"`);
  return resp.body.links[0].url;
}