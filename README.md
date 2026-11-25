# Vamos 西语 – web app for iPhone

Spanish sentence practice for Chinese speakers: 673 sentences (中文 → español), flash cards with 5,100 words, and an AI tutor (DeepSeek) that explains wrong answers in Chinese.
This folder is the iPhone version: a web app that you put on the Home Screen. It opens full-screen with its own icon, works offline, and keeps the progress on the phone.

## Put it online (once, about 5 minutes)

1. Sign in at [github.com](https://github.com) (a free account is enough) and create a new repository: **+** → **New repository**, name it `vamos`, choose **Public**, then **Create repository**.
2. On the new repository page click **uploading an existing file**. Drag **everything in this folder** into the page – the files *and* the folders `data` and `icons` – then click **Commit changes**.
3. Open **Settings** → **Pages**. Under *Build and deployment* choose **Deploy from a branch**, branch **main**, folder **/ (root)**, and click **Save**.
4. Wait one or two minutes and reload the Pages screen: it shows the address, for example `https://YOUR-NAME.github.io/vamos/`.

## Install it on the iPhone (iOS 26)

1. Open the address in **Safari**.
2. Tap **⋯** (bottom right) → **Share** → **Add to Home Screen**. Keep **Open as Web App** switched on and tap **Add**.
   (On an iPhone in Chinese: ⋯ → 共享 → 添加到主屏幕.)
3. Open **Vamos** from the Home Screen. Practice there, not in the Safari tab: the Home Screen app keeps its own progress, separate from Safari.

Optional:
- **AI tutor**: in Vamos tap the gear → **AI tutor (DeepSeek)**. The sheet links to the DeepSeek page where you create an API key; paste it there. DeepSeek is the tutor, with the model `deepseek-flash` by default (`deepseek-v4-pro` can be chosen). The key stays on the iPhone.
- **A better voice**: words and sentences are read by the iPhone's own Spanish voice. For a clearer one: Settings → Accessibility → Read & Speak → Voices → Spanish → download an *Enhanced* or *Premium* voice (for example Paulina). Vamos picks the best Spanish voice by itself; the gear lets you choose Latin America or Spain.

## Backups

The progress is kept only inside the app on the iPhone. If the Vamos icon is deleted from the Home Screen, or the website data is cleared in Settings, the progress is deleted with it. So:

- Gear → **Backup** → **Save a backup**, then in the menu choose **Save to Files** (存储到“文件”) → a folder in **iCloud Drive** (or send it to yourself). The file is `vamos-backup-<date>.json`.
- Vamos reminds you on the Practice screen when the last backup is a week old and you practiced since (or after your first session). **Later** waits three days; the reminder can be switched off in the Backup sheet.
- To get the progress back (new phone, reinstalled app): gear → **Backup** → **Restore from a backup** → choose the file. Vamos shows what the file holds and what is on the phone before anything is replaced.
- Backups work both ways between this web app and the Vamos Android app.
- The DeepSeek key and the voice choice are not in the backup.

## Update to a new version

Upload the changed files to the same repository again (Add file → Upload files → Commit changes). After a minute, open Vamos; it fetches the new files in the background and switches over at the next quiet moment (no session open). If it does not, close the app (swipe it away) and open it again.

## Good to know

- No App Store, no Apple developer account, no Mac. The repository has no personal data: progress and key stay on the phone.
- The app works without internet after the first start. Only the AI tutor needs internet; it sends the Chinese sentence, the correct answer and your answer to `api.deepseek.com`.
- Every repository of one GitHub account shares the same web address (`YOUR-NAME.github.io`) and therefore the same browser storage. Do not put pages from other people under the same account.
- Files: `index.html`, `web.js`, `web.css`, `sw.js` (offline copy), `manifest.webmanifest` and `icons/` are the web-app parts; `app.js`, `check.js`, `online.js`, `styles.css` and `data/` are the same as in the Android app.

Sources of the content and licences: in the app, gear → About and credits. The dictionary data comes from doozan/spanish_data (CC BY-SA).
