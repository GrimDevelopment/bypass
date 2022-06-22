# Heroku Setup

Setting up Heroku is pretty simple.

## Prerequisites

You need to download and install [Heorku CLI](https://devcenter.heroku.com/articles/heroku-cli) on your system.

## Steps

1. Open a terminal and navigate to your BIFM folder.

2. Run the following command: `heroku git:remote -a bifm-rewritten` - This adds a Heroku git repository.

3. Run this to add buildpacks ([or use the web UI here](https://files.gay/r/d1doA/Screenshot%20from%202022-06-22%2015-56-05.png)).

```sh
heroku buildpacks:clear
heroku buildpacks:add --index 1 https://github.com/jontewks/puppeteer-heroku-buildpack
heroku buildpacks:add --index 1 heroku/nodejs
```

4. Run the following to commit to Heroku. `git add . && git commit -am "deploying to heroku"`

5. Run the follow to push to Heroku. `git push heroku main`

## All commands

If you don't care about steps, just copy and paste this into the terminal.

```sh
heroku git:remote -a bifm-rewritten
heroku buildpacks:clear
heroku buildpacks:add --index 1 https://github.com/jontewks/puppeteer-heroku-buildpack
heroku buildpacks:add --index 1 heroku/nodejs
git add . 
git commit -am "deploying to heroku"
git push heroku main
```