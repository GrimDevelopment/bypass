# API Documentation

This is the documentation to using our API in a project of some kind.

## Notice

When using our API, no matter the instance, you must follow our [license terms](../LICENSE). This includes **giving attribution even when you use a private instance**. [Learn more here](https://choosealicense.com/licenses/agpl-3.0/). 

## Endpoints

Click to expand each endpoint.

<details>
  <summary>
    <code>GET /api/bypass</code> - Get a bypass
  </summary>

### Parameters

|Name|Type|Required|Description|
|---|---|---|---|
|`url`|`string`, URL encoded|Yes|The URL of the adlink you want to bypass.|
|`ignoreCache`|`boolean`: `true`/`false`|No|Determines if you want to avoid using the cache for your solution.|
|`allowCache`|`boolean`: `true`/`false`|No|Determines if you don't want to have your link's solution be in the cache.|
|`ignoreFF`|`boolean`: `true`/`false`|No|Determines if you don't want to avoid checking FastForward's Crowd Bypass for a destination.|
|`allowFF`|`boolean`: `true`/`false`|No|Determines if you don't want to sync certain types of links to FastForward's Crowd Bypass.|
|`password`|`string`, URL encoded|Yes, if link is passworded.|Password of the link.|
|`referer`|`string`, URL encoded|No|Referer of the bypass, use if the site you're bypassing is referer locked.|


### Responses

A successful response would look like this.

```json
{
  "success": true, // Detemines success of request.
  "destination": "https://git.gay/a/bifm", // Destination of URL.
  "originalUrl": "https://ouo.io/2dktqo", // The original URL.
  "dateSolved": 1655685246159, // JS Date() output
  "fromCache": true, // Determines if the solution came from the BIFM instance's cache or not.
  "fromFastforward": false, // Determines if the solution came from FastForward's Crowd Bypass feature or not.
  "isURL": true // Determines if the response given is a visitable URL. If it's false, the destination is text (likely from a paste).
}
```

An errored response would look like this.

```json
{
  "success": false, // Detemines success of request.
  "error": "Navigation timeout of 30000 ms exceeded", // error message, see console for error trace
  "fromBackend": true // determines if error is from frontend or backend
}
```
</details>

<details>
  <summary>
    <code>GET /api/count</code> - Get the count of cached links
  </summary>

### Parameters

There are none.

### Responses

A successful response from a server with a cache would look like this.

```json
{
  "success": true, // Determines success of request.
  "count": 100 // The number of destinations in the cache.
}
```

If you server has no cache, or has nothing in the cache, a response would look like this.

```json
{
  "success": true, // Determines success of request.
  "count": 0 // The number of destinations in the cache.
}
```

</details>