# VidNinja

[![VidNinja Image](.github/VidNinja.png)](https://docs.pstream.mov)

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvidninja%2Fvidninja)

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/vidninja/vidninja)

**NOTE: To self-host, more setup is required. Check the [docs](https://docs.pstream.mov) to properly set up!!!!**

## Links And Resources

| Service       | Link                                            | Source Code                                            |
| ------------- | ----------------------------------------------- | ------------------------------------------------------ |
| VidNinja Docs | [docs](https://docs.pstream.mov)                | [source code](https://github.com/vidninja/docs)        |
| Extension     | [extension](https://docs.pstream.mov/extension) | [source code](https://github.com/vidninja/browser-ext) |
| Proxy         | [simple-proxy](https://docs.pstream.mov/proxy)  | [source code](https://github.com/vidninja/sudo-proxy)  |
| Backend       | [backend](https://server.fifthwit.net)          | [source code](https://github.com/vidninja/backend)     |
| Frontend      | [VidNinja](https://docs.pstream.mov/instances)  | [source code](https://github.com/vidninja/vidninja)    |
| Weblate       | [weblate](https://weblate.pstream.mov)          |                                                        |

**_I provide these if you are not able to host yourself, though I do encourage hosting the frontend._**

## Referrers

- [FMHY (Voted as #1 streaming site of 2024, 2025)](https://fmhy.net)

## Running Locally

**📖 First time setup? See [SETUP.md](SETUP.md) for detailed instructions including GitHub token setup.**

Type the following commands into your terminal / command line to run VidNinja locally

```bash
git clone https://github.com/vidninja/vidninja.git
cd cloudclash
git pull

# Setup environment (Windows)
.\install.ps1

# Or setup manually
copy .env.example .env
# Edit .env and add your GitHub token (see SETUP.md)
pnpm install

# Start development server
pnpm run dev
```

Then you can visit the local instance [here](http://localhost:5173) or, at local host on port 5173.

## Updating a VidNinja Instance

To update a VidNinja instance you can type the below commands into a terminal at the root of your project.

```bash
git remote add upstream https://github.com/vidninja/vidninja.git
git fetch upstream # Grab the contents of the new remote source
git checkout <YOUR_MAIN_BRANCH>  # Most likely this would be `origin/production`
git merge upstream/production
# * Fix any conflicts present during merge *
git add .  # Add all changes made during merge and conflict fixing
git commit -m "Update vidninja instance (merge upstream/production)"
git push  # Push to YOUR repository
```

## Contact Me / Discord

[Discord](https://discord.gg/7z6znYgrTG)
