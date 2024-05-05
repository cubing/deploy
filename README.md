# @cubing/deploy

Dreamhost-compatible deploys using [`bun`](https://bun.sh/) and `rsync`.

1. Install:

```shell
bun add --development @cubing/deploy
# or
npm install --save-dev @cubing/deploy
```

2. Add URLs to `package.json`:

```json
{
  "@cubing/deploy": {
    "https://experiments.cubing.net/test/deploy": {}
  }
}
```

3. Run:

```shell
bun x @cubing/deploy
```
