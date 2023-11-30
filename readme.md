# 用 monaco-editor 编写 c/c++ 代码，底层用到了 clangd 作为 language server protocal，支持智能补全、跳转等功能

prerequisites:
1. install llvm/clang

change the path in src/server.ts

```ts
const clangdPath = path.join(process.cwd(), 'bin/clangd.exe');
```

1. yarn
2. yarn build
3. yarn start:server
4. open dist/index.html in your browser