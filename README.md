# Nobody Mows

A single-file idle lawn-mowing game designed to be hosted on GitHub Pages and embedded in Blogger with an iframe.

## Quick start
1. Create a new GitHub repository, e.g. `nobody-mows`.
2. Upload `index.html` to the repository root.
3. GitHub → Settings → Pages → Build and deployment → Deploy from a branch.
4. Choose `main` and `/ (root)`, then Save.
5. Your game URL will look like: `https://YOURNAME.github.io/nobody-mows/`

## Blogger iframe
Replace the URL below with your GitHub Pages URL:

```html
<div style="width:100%;max-width:980px;margin:24px auto;overflow:hidden;border-radius:18px;">
  <iframe
    src="https://YOURNAME.github.io/nobody-mows/"
    title="Nobody Mows idle lawn game"
    style="display:block;width:100%;height:900px;border:0;"
    loading="lazy"
    allow="fullscreen"
  ></iframe>
</div>
```

## Save system
Progress is stored in the player's browser via `localStorage`. There is no server or login.
