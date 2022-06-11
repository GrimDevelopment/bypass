# bifm 

Bypasses link protectors server-side. Now with more sites and easier to develop for.

## why server-side?

Fetching the pages from the client requires sending some information about your device to the tracking server (HTTP headers, IP address). For obvious reasons, this is not a great solution. It defeats the purpose of bypassing tracking links. By using a server-side solution, information about your client are never sent to these tracking servers, unless you explicitly want to.

## licensing notice

Since [this commit](/temp), this rewrite is using the APGL license, meaning that BIFM now requires attribution if you are using BIFM as an API, docs of which are coming shortly.
If you would rather use the Unlicense version, use [this commit and behind](/temp).

## supported sites

- ouo.io/.press
- boost.ink & aliases
- ity.im
- sh.st & aliases
- social-unlock.com
- lnk2.cc
- linkvertise & aliases
- cshort.org
 
## sites being worked on 
- mylink aliases
- aylink