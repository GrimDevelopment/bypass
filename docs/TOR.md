# Using Tor with BIFM

Using Tor with BIFM allows for your instance to be more anonymous to the sites it vists. Here's a quick start guide to enabling Tor on BIFM.

1. Install Tor on your system.

This is pretty simple to do on Linux, simply ask your package manager to install Tor.

## Ubuntu/Debian

```sh
sudo apt install tor
```

## Arch Linux

```
sudo pacman -S tor
```

2. Enable it to run on bootup of your system.

## systemctl

```sh
sudo systemctl start tor && sudo systemctl enable tor
```

3. Verify the Tor proxy is on.

```sh
curl --socks5 localhost:9050 --socks5-hostname localhost:9050 -s https://check.torproject.org/ | cat | grep -m 1 Congratulations | xargs
```

If the command in your terminal outputs "Congratulations. This browser is configured to use Tor.", you are set to change the setting in the config, allowing Tor to run on Tor-compatible bypasses.

4. Changing the config.

Open `config.json` in your editor, if you haven't already.

The default file looks like [this](./CONFIG.md), you should change the `defaults` object to be something like this:

```js
  "defaults": {
    "axios": {
      "headers": {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      "proxy": {
        "type": "socks5",
        "host": "127.0.0.1",
        "port": "9050"
      }
    },
    "puppeteer": {
      "headless": true,
      "args": ["--proxy-server=socks5://127.0.0.1:9050"]
    }
  }
```