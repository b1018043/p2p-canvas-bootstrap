# p2p-canvas bootstrap node
libp2pを利用したp2pのお絵描きアプリのbootstrap node
## 利用方法
```bash
npm i
node id-gen/index.js > id.json
node bootstrap/index.js
```
*利用の際は環境変数`LIBP2P_FORCE_PNET`を`unset`などを用いて削除しておくこと* 
## 利用技術
- libp2p