# bun-ghovas

ブラウザ上の無限キャンバスにターミナルウィンドウを自由配置する browser-native window manager。プロダクト名は `ghovas`。

構想の全体像は [`conao3/idea` の projects/bun-ghovas.md](https://github.com/conao3/idea/blob/master/projects/bun-ghovas.md) を参照。

## 開発環境

Bun ランタイムを Nix flake で固定している。

```sh
nix develop
bun install
bun run dev
```

`bun run dev` でローカル開発サーバが起動する (既定 port `3000`)。

## Running

```sh
bun run src/server/index.ts
```

```sh
bun run scripts/pty-smoke.ts
```

## ライセンス

Apache-2.0
