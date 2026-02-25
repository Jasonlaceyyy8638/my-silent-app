# Redeploy to GitHub (triggers Netlify)

Redeploy by pushing this repo to **https://github.com/Jasonlaceyyy8638/my-silent-app**.  
If your host (e.g. Netlify) is connected to that repo, it will build and deploy on push.

## If this folder is not yet a git repo

In a terminal (PowerShell or Git Bash) in this project folder:

```bash
git init
git remote add origin https://github.com/Jasonlaceyyy8638/my-silent-app.git
git add .
git commit -m "Redeploy: latest changes"
git branch -M main
git push -u origin main
```

If the repo already has history and you're replacing it (use with care):

```bash
git push -u origin main --force
```

## If this folder is already cloned from that repo

```bash
git add .
git commit -m "Redeploy: latest changes"
git push origin main
```

After pushing, open your Netlify (or other) dashboard linked to **Jasonlaceyyy8638/my-silent-app** to watch the new deploy.
