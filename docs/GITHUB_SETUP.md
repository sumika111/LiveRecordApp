# GitHub に push する手順

リポジトリの初期化と初回コミットは済んでいます。あとは GitHub にリポジトリを作り、このフォルダとつなげて push するだけです。

---

## 1. GitHub でリポジトリを 1 つ作る

1. https://github.com にログインする。
2. 右上の **+** → **New repository** をクリック。
3. **Repository name** に好きな名前を入れる（例: `live-record-app`）。
4. **Public** のままにする（Private でも可）。
5. **「Add a README file」などはチェックしない**（ローカルに既にコードがあるため）。
6. **Create repository** をクリック。

---

## 2. 作ったリポジトリを「リモート」として追加して push する

GitHub の画面に **「…or push an existing repository from the command line」** と出ているので、その 2 行をそのままターミナルで実行します。

例（**あなたのユーザー名・リポジトリ名に書き換えてください**）:

```bash
git remote add origin https://github.com/あなたのユーザー名/live-record-app.git
git push -u origin main
```

- **HTTPS でパスワードを聞かれた場合**  
  - パスワードには **Personal Access Token (PAT)** を使います。  
  - GitHub → **Settings** → **Developer settings** → **Personal access tokens** でトークンを作成し、そのトークンをパスワード欄に入力します。
- **SSH を使う場合**  
  - 上記の URL を `git@github.com:あなたのユーザー名/live-record-app.git` に変えて同じ手順で OK です。

---

## 3. これ以降のコミット・push

コードを直したあとは、いつも次の流れで GitHub に反映できます。

```bash
git add .
git commit -m "メッセージ（何をしたか短く）"
git push
```

---

## 補足

- **`.env.local`** は `.gitignore` に入っているので、push されません（秘密情報は GitHub に上がりません）。
- ブランチ名は **main** のままです。別ブランチでやりたい場合は `git checkout -b ブランチ名` で切ってから push してください。
