# bifm 

Bypasses link protectors server-side. Now with more sites and easier to develop for.

## why server-side?

Fetching the pages from the client requires sending some information about your device to the tracking server (HTTP headers, IP address). For obvious reasons, this is not a great solution. It defeats the purpose of bypassing tracking links. By using a server-side solution, information about your client are never sent to these tracking servers, unless you explicitly want to.

## licensing notice

Since [this commit](https://git.gay/a/bifm/commit/adec8de080c4f18545ba3d7cfb4e7edffa7edf80), this rewrite is using the APGL license, meaning that BIFM now requires attribution if you are using BIFM as an API, docs of which are coming shortly.
If you would rather use the Unlicense version, use [this commit and behind](https://git.gay/a/bifm/commit/5db9b17f7796bac35170e00acfe9da043cbc4b29).

## roadmap
- Add proper documentation (40% done).
  - Merge `./docs/EXAMPLE.md` and `./docs/SITES.md`.
  - Write more contributing information.
  - Add API docs and instance list.
- Improve frontend site.
  - Get rid of EJS entirely, make frontend entirely static.
  - Detect when the site itself is down, like previous version.
- Support all active sites the previous edition supported.
- Add general link list sites. Examples like:
  - carrd.co
  - linktr.ee
  - mirrorace.org
- Support the following:
  - oke.io ([sample link](https://oke.io/D3wL))
  - karung.in ([sample link](http://karung.in/Gyucc))
  - adlinkfly template ([sample link](https://adlinkfly.mightyscripts.xyz/cdlSsrpD))
 
## sites being worked on 
*Suggest some.*