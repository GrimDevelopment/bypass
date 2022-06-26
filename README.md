# BIFM

A modular, easy to use, server-side link bypasser.

## Why is server-side better?

Fetching the pages from the client requires sending some information about your device to the tracking server (HTTP headers, IP address). For obvious reasons, this is not a great solution. It defeats the purpose of bypassing tracking links. By using a server-side solution, information about your client are never sent to these tracking servers, unless you explicitly want to.

## Licensing Notice

Since [this commit](https://git.gay/a/bifm/commit/adec8de080c4f18545ba3d7cfb4e7edffa7edf80), this rewrite is using the APGL license, meaning that BIFM now requires attribution if you are using BIFM as an API, docs of which are coming shortly.
If you would rather use the Unlicense version, use [this commit and behind](https://git.gay/a/bifm/commit/5db9b17f7796bac35170e00acfe9da043cbc4b29).

## Roadmap
- Improve frontend site.
  - Detect when the site itself is down via the frontend, like previous version.
- Add back proper Heroku support.
- Add referer support.
- Find a way around the 30 second rule on Heroku.
 
### Sites being planned

There's a general need on our part to support all sites that previously were supported, but these are also some we would like to get done.

- mirrorace.org