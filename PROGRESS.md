# Vamos (formerly Frase) – progress log

Notes for continuing this work later (for you or for Claude).

## 1.3.3 (2026-11-25): "Download all recordings" for offline use – web app only
User: "Optional 'Download all recordings' button in Preferences: about 30 MB, so every word and sentence works offline".
- Preferences → Offline recordings (sheet `rec`): Download / Stop / Download the rest / Remove, progress bar, the line in
  Preferences says how far it is. Saves the 5,207 recordings (4,534 words + 673 sentences, about 30 MB; 9 s on a fast
  connection) into the cache `vamos-rec-v1`, 6 downloads at a time; resumes where it stopped (only missing files).
  `navigator.storage.persist()` asked again. localStorage `vamos-rec` = `{done: true}` once all are saved.
- Only when all are saved the app asks for recordings with `?off=1` (`recUrl`), and sw.js answers those from
  `vamos-rec-v1`, cut to the byte range Safari asks for (`part()`: 206 + Content-Range; suffix and open ranges too). A file
  that is not there goes to the network. Without `?off=1` nothing changes from 1.3.2 (no risk for those who don't download).
  The activate step keeps `vamos-rec-v1` when the app updates.
- At the start (after 1.5 s) the app checks the saved copy against the list: files missing (the iPhone removed the data,
  or new recordings) → `done` dropped, the sheet offers "Download the rest".
- Tests (Playwright, service worker on): download of all 5,207 from a local server, offline answers for bytes=0-1 /
  bytes=2- / whole file, offline start, `?off=1` only after the download, Remove. Not yet tried on the iPhone itself.

## 1.3.2 (2026-11-25): recordings heard in silent mode, DeepSeek compares with the closest answer – web app only
User: "the audio doesn't play in my iphone 14 pro". Cause found with sound-test.html: the phone was in silent mode, and the
iPhone's voice (speechSynthesis) always follows the silent switch, whatever the page does (1.3.1's trick did not help).
"is there a way to still play sound in silent mode?" → chosen: "Both: human recordings for words, Piper for sentences",
voice A (es_MX "claude"). Then: "make deepseek compare the users answer to the 'closest answer'". **Confirmed working on the
iPhone 14 Pro, in silent mode too.**
- Where the web app lives: github.com/alonso771/vamos = the dist/ios-web files at the root, GitHub Pages from `main`
  (https://alonso771.github.io/vamos/). The user allowed Claude to push straight to `main` (no pull requests needed).
  That repo has no tools/ and no Android source: 1.3.1/1.3.2 were made there, see "Open points".
- HTML audio plays in silent mode on the iPhone, speechSynthesis doesn't. So the web app plays files:
  - Words: `data/words/<n>.m4a` = the Ogg files of word-audio.zip converted with ffmpeg (`-c:a aac -b:a 32k -ar 24000 -ac 1
    -movflags +faststart`, 21 MB). `data/words.js` and `licenses/lingualibre.txt` taken from Vamos-1.3.apk (assets/www);
    the licence header says the web app has the same files as AAC. On the web, words.js is loaded at the start, so the
    recording starts inside the tap (Safari needs that).
  - Sentences: `data/say/<id>.m4a`, the 673 `s.es` read by Piper 1.8.0 (`pip install piper-tts`), voice
    es_MX-claude-high (huggingface.co/rhasspy/piper-voices; dataset HirCoir/Piper-TTS-Spanish, Apache 2.0),
    `length_scale` 1.08, silence trimmed + 60 ms lead, AAC 32k 22.05 kHz (8.6 MB). Also tried: es_MX-ald-medium,
    es_AR-daniela-high (CC BY-SA). Only the app's own sentences have files; own sentences and edited ones use the voice.
  - web.js: `window.AUDIO_EXT = 'm4a'` and `window.SAY_AUDIO = { dir, ext, credit }` (replaces WORD_AUDIO_OFF).
    app.js: `speak(text)` → `sayClip(text)` (built-in `s.es` → id) → `fcPlay`; no file / load error → `speakVoice` (the
    phone's voice). `fcPlay` sets `navigator.audioSession.type = 'playback'` on the iPhone. `SAY_CREDIT` in About.
- sw.js: recordings (.m4a/.ogg/.mp3) bypass the service worker (Safari asks for byte ranges; they are not kept offline:
  without internet a word or sentence never played before falls back to the voice). Pages other than ./ and index.html
  (sound-test.html) come from the network (before, every page of the site was answered with the app). `data/words.js`
  is precached. VERSION was set by hand (sha1 of the files), as tools/build_web.py isn't in that repo.
- DeepSeek (`aiPrompt`): "最接近的正确答案" = `res.closest` (what the result panel shows as "Closest correct answer"),
  "标准答案（仅供参考）" = `s.es` when different, other accepted answers leave both out; the system prompt asks to keep the
  learner's wording and not to push the model answer.
- `sound-test.html` (in the web repo): plays sound 7 ways (beep, plain voice, English, chosen voice, playback + silent
  clip, playback only, beep + voice) and logs events, voices and audioSession, with "Copy results". For future sound bugs.
- Tests: quick Playwright checks only (iPhone 14 Pro emulation, stand-ins for speechSynthesis and DeepSeek): words and
  sentences play their files, missing file → voice, own sentence → voice, words.js loaded at start, DeepSeek message,
  offline start, sound-test.html opens with the service worker in place.

## 1.3.1 (2026-11-25): light/dark mode, iPhone voice fixes – web app only
- Preferences → Appearance: Dark (default) / Light / Auto (follows the phone). localStorage `vamos-theme` (not in the
  progress or the backup). `html.light` block at the end of styles.css (variables + every hard-coded colour); `--track`
  variable (progress bar, summary ring); an inline script in index.html sets the class before the CSS loads; meta
  theme-color / color-scheme follow. web.css: a purple band behind the status bar in light mode (black-translucent keeps
  the iPhone's status bar text white).
- speechSynthesis on the iPhone: the utterance is kept in a variable, a paused synth is resumed, a voice that hasn't
  started after 2.5 s (or fails) is retried with the language only, then a "No sound?" hint; cancelled when the app is
  hidden; `audioSession = 'playback'` + a looping silent WAV while speaking (did not beat the silent switch, see 1.3.2).
- Version 1.3.1 in app.js; sw.js VERSION by hand.

## 1.3 (2026-11-25): iPhone web app, easier backups – Vamos-1.3.apk (code 4) + dist/ios-web
User: "Do this port to iOS – Web app added to the Home Screen … host the app's web files (GitHub Pages) … Prepare files that
can be uploaded to github to run the app on ios 26 (iphone 14 pro). Make backup easy and more intuitive. Aim to use deepseek
as the default model for questions." Then: "for audio, maybe consider playing using own phone words sound if it's easier".
- Web app = the same web/ files + ios/ overlay, assembled by tools/build_web.py (see README "iPhone"). app.js knows where it runs:
  `WEB = !window.AndroidBridge`, `IOS` (UA iPhone/iPad, or MacIntel with touch), `standalone()` (navigator.standalone /
  display-mode). online.js already made FraseBridge without the Java shell (only the DeepSeek part works there).
- DeepSeek from GitHub Pages: checked in a real browser that api.deepseek.com answers a cross-origin request from
  https://pages.github.com (readable 401 → CORS allowed), so no proxy. Default model deepseek-flash (deepseek-v4-pro to choose).
  The set-up sheet in the web app links to platform.deepseek.com/api_keys with 3 steps; the key field is a text field with
  -webkit-text-security (no "save password?" of the iPhone).
- Voice (web): speechSynthesis with the best Spanish voice (voiceScore: region for the chosen variety, Premium/Enhanced +,
  Eloquence/novelty voices only as a last resort); u.voice is set (iOS 26 no longer follows the voice chosen in Settings for
  "es" alone); cancel only while speaking (Safari can drop the next utterance after cancel()); "interrupted" is not a failure;
  navigator.audioSession.type = 'playback' (silent switch). Words: WORD_AUDIO_OFF (web.js) → fcWordAudio gives null at once,
  so the voice starts inside the tap (Safari needs that). No .ogg in the web build.
- Backups (both builds): Backup sheet (status, Save, Restore, what is inside, reminder switch), first item in Preferences.
  `vamos-backup-info` in localStorage (not in the progress): at, print (hash of the progress with sorted keys), answered,
  remind, later. Due: changed since the backup, reminders on, no Drive file linked, not snoozed, and (never saved and ≥ 10
  answers or ≥ 10 cards) or (≥ 7 days or ≥ 100 answers since). Exported JSON gets savedAt and device. Web save: navigator.share
  ({ files }) only (a title or text would be saved as extra files by "Save to Files"); AbortError → "Not saved"; no share →
  download. Android: Native.saveFile, __fileSaved(ok) records it. Restore: a picker input kept in the page (Safari), the
  confirm sheet compares the backup with the phone (date from savedAt / sync.at / file date) and warns when the backup has
  fewer answers. A new empty app offers "Have a Vamos backup?".
- iPhone details: viewport-fit=cover + black-translucent status bar; web.css pads #app and the fixed parts with
  env(safe-area-inset-*); web.js fits #app to visualViewport while the keyboard is open (html.kb, --vvh, --vvt; the iPhone
  keeps the layout height), hides the tab bar then; text fields ≥ 16 px (no zoom); the answer field is focused inside the tap
  on the iPhone (the keyboard opens only then). sw.js: precache with cache:'reload', cache-first, old caches deleted; web.js
  reloads to an update only when the app is idle (Practice/tabs, no sheet) and checks for one hourly when the app comes back.
- Tests: web_test.js 55 checks (new); ui_test.js 61, ui_test_more.js 22, checker 1,987.

## 1.2 (2026-11-24): "Chinese meaning first" fixed, cat-in-boots icon – Vamos-1.2.apk (code 3)
- User: "the 'chinese meaning' option in the flash cards doesn't do anything". The choice only changed the front of the cards in a
  study session; in the Cards tab nothing changed but the chip. Now the starred list follows it (the Chinese meaning is shown and
  the Spanish word blurred until "Tap to unblur"), a toast says what changed, and the choice is kept in the progress
  (`state.fc.front`, saved through the Java shell; 1.0/1.1 used localStorage only, still read once for the old choice).
  A card that shows the Chinese first no longer gives the answer away: the part of speech is shown without forms (`fcPosHint`,
  not "feminine: amiga") and the word is hidden inside its own meanings ("tener que 必须" → "～ que 必须", `fcMaskWord`).
- Icon: user asked for "something related to el gato con botas". It's an original drawing of the fairy-tale cat (Perrault), not
  the cat from the films: a cream cat with a purple hat, a gold feather and brown boots, on the warm gradient.
  Source `tools/icon.svg`, rendered by `tools/make_icon.py` (rsvg-convert) into res/mipmap-*/ic_fg.png. Checked against the
  visible circle (radius 144 of 432) and squircle masks. The same cat (without its shadow) is in the tile next to the name
  (`LOGO` in app.js).
- Tests: ui_test.js 57 checks (card front: list, toast, kept in the progress and after a restart, nothing Spanish on the
  Chinese front), ui_test_more.js 22, checker 1,987.

## 1.1 (2026-11-24): 5,147 words, new name "Vamos" – Vamos-1.1.apk (code 2)
User: extend the dictionary ("you think that 2652 words is enough?" → about 5,000) and "change the name to something more catchy".
- Name: Vamos ("let's go"); launcher label "Vamos 西语" (like "Juzi 句子"). Only the visible name changed: package
  com.studytools.frase, the Java package, `window.FraseBridge` and the storage keys (frase-state-v1, frase-ai, frase-voice,
  `app: "frase"` in the progress) stay, so 1.1 installs over Frase 1.0 and old backups still restore. New file names:
  vamos-backup-<date>.json, vamos-progress.json (Drive; a file linked before keeps working).
- Dictionary: +2,495 words = the next most common lemmas of the frequency list (work list: rows up to about 6,200), without names,
  English words, letters, vulgar words, feminine/possessive forms (buena, mía) and bare participles of verbs already in the
  dictionary. Meanings written in batches and checked (format, genders, duplicates). 1,096 verbs with conjugations; reflexive
  headwords where the verb is used so (comportarse, suicidarse, divorciarse, graduarse…).
- Plurals and genders: llana words in -en/-on get the accent (joven → jóvenes, examen → exámenes, imagen → imágenes); país →
  países (hiatus); irregular plurals in the info field (`m;pl=regímenes`, carácter → caracteres); invariable adjectives via
  `f=same` (mejor, peor, mayor, menor, superior, inferior, interior, exterior, anterior, posterior, marrón); "f;m"/"m;f" =
  both genders with different meanings (la editorial / el editorial, el corte / la corte). Same rules in app.js and build_dict.py.
- Recordings: 4,534 of the 5,147 words (88%), 23 Lingua Libre speakers. They were all in the download made for 1.0, so no new
  download was needed. word-audio.zip is now 9.9 MB, and dict.js is 719 KB.

## 1.0 (2026-11-24): first version – Frase-1.0.apk (code 1, 5.5 MB)
User's request: a copy of Juzi Online for learning Spanish, for Chinese speakers, with a new name. Show the Chinese sentence and
have the learner write it in Spanish, with several accepted Spanish answers per sentence. DeepSeek only, and it explains wrong
answers in Chinese. Real recordings of Spanish words for the flash cards. Menus and buttons in English; everything else in Chinese.
Main Spanish: Latin American, chosen by the user (Spain forms accepted, Spain voice available).

- **Not yet tested on a phone.** Tested in Chrome (puppeteer) with strict stand-ins for the Java bridge and for DeepSeek:
  `tools/ui_test.js` (51 checks) and `tools/ui_test_more.js` (22 checks, 360 px screen), plus `tools/test_check.js` (1,987 checks).
- Package `com.studytools.frase`, same signing key as the Juzi apps (keystore/release.jks, alias sentencepractice).
  One flavour only. INTERNET permission (DeepSeek only); TTS_SERVICE query; backup rules leave out `app_webview`
  (the API key) and `sync.xml`.
- Java (`src/com/studytools/frase/`): Juzi's MainActivity without the model runner (no Llm/EngineRunner/EngineSession).
  Spanish TTS: `ttsSetVoice("es-US"|"es-ES")`. Latin America tries es-US (Google's Latin American voice), then es-MX, es-419
  and any es. Spain tries es-ES, then any es. Rate 0.9. Up to 400 characters, so whole sentences can be read. If there's no
  voice, `__ttsFailed` → a toast explaining how to add one. `Sync.available()` returns true (Drive backup file on; it was
  meant for Juzi AI only).
- `web/online.js` (now a source file, no longer generated): `window.FraseBridge` passes the 16 Java methods on
  (`tools/check_bridge.py` compares with MainActivity) and adds DeepSeek: key + model in localStorage `frase-ai`. Models
  deepseek-flash (default) and deepseek-v4-pro, streaming, `thinking: disabled`. The page sends JSON messages: the system
  prompt in Chinese asks for 2–4 short points, ≤150 汉字, and ends "必须用中文回答".
- `web/app.js`: one file (was written in 3 parts). Prompt = `s.zh`, answer = `s.es`, `Check.evaluate`. Result panel: your
  answer with the wrong words marked, the closest accepted answer, the correct answer (words can be tapped → dictionary sheet),
  "Also accepted" with the patterns shown as a / b and (…), Listen (TTS), Ask DeepSeek, I was right, interval. Accent keys under
  the answer and in the "accepted answer" sheet (`accentBar` / `accentInsert`). State key `frase-state-v1`, `app: "frase"`:
  backups without it, such as Juzi's, are refused.
- `web/check.js`: the Spanish checker (see its header). Pronouns: yo always dropped; tú/nosotros/vosotros dropped unless after a
  preposition; él/ella/usted/ellos/ellas/ustedes may be left out by the learner. Numbers in words = digits (up to 9,999; times
  8:30 / 8.30 / ocho y media). Accent-only differences are accepted with `accent: true` and marks. Regional words through RULES
  (acá/aquí, ahorita/ahora…). Caps: 3,000 expansions per pattern, 9,000 per sentence (largest sentence: 4,801).
- Flash cards: `web/data/dict.js` (2,652 words, frequency order; 584 verbs with 7 tenses + gerund + participle). Cards keep
  `{w, pos, info, m, sel, note, k}`. Search: Spanish word, any form (tengo → tener · present · yo). Pronouns attached to an
  infinitive, gerund or affirmative imperative are recognised, with agreement rules (`fcEncOk`): siéntate → sentar (not
  sentir), vámonos → ir. Chinese searches the meanings. Card front: Spanish word or Chinese meaning (localStorage
  `frase-fc-front`). "In your sentences": the shortest sentences that use any form of the word.
- Dictionary additions this version: no, a, muy, la, los, las, lo, le, les, me, te, nos, os, ti, contigo, su, tu, esto, eso,
  aquello, tranquilo, afuera, pizza, internet, senderismo, primaria, secundaria, yuan, Navidad, and names (China, España,
  México, Pekín, Shanghái, Cantón, Shenzhen; pos `prop`). `build_dict.py` fixes: "ir" was missing its conjugation;
  reflexive verbs (quejarse → me quejo…, quéjate); a usage form that is itself a word isn't added as a form of another word
  (muy isn't listed under mucho); frequency from lemma or form counts.
- Word audio: 2,444 recordings (19 Lingua Libre speakers), Ogg Opus 16 kbit/s, 4.9 MB zip. The words added this version
  have no recording except "a" (they weren't in the download). They use the phone's voice.
- Icon: white Ñ on a warm gradient (replaced by the cat in boots in 1.2).

### Data sources (how they were obtained)
- Lingua Libre (Wikimedia Commons, Category:Lingua_Libre_pronunciation-spa): only reachable through the user's own browser
  (the sandbox can't reach Wikimedia). Collected there into a zip with manifest.tsv, one recording per word, chosen by speaker.
  The 95 MB zip `frase-lingualibre-spa.zip` and `frase-download-test.txt` in `study\Android_app\` are no longer needed.
- doozan/spanish_data frequency.csv (git clone from GitHub); verbecc 2.1.0 from PyPI (`CompleteConjugator`; pasar, suceder,
  resultar and nevar fail in it and get regular endings).

### Open points
- **Bring 1.3.1 / 1.3.2 into the Android project** (only the web repo was available): web/app.js, web/styles.css;
  ios/index.html, ios/web.js, ios/web.css, ios/sw.js; add sound-test.html; tools/build_web.py must copy data/words.js,
  data/words/*.m4a, data/say/*.m4a and licenses/lingualibre.txt and list data/words.js in FILES. The Android app needs
  app.js for the DeepSeek change and the Appearance option (the Java shell's status bar stays dark); it keeps its Ogg
  recordings and native TTS. tools/web_test.js still expects WORD_AUDIO_OFF: update it for the recordings.
- Web: recordings are kept offline only after Preferences → Offline recordings → Download (1.3.3); check it on the iPhone in flight mode.
- Test on the phone: typing with the accent keys, the Spanish voice (es-US), word recordings, DeepSeek with a real key,
  Drive backup file, and Back.
- Juzi Online (not Frase): its `Sync.available()` only returns true for the ".ai" package, so Juzi Online shows no Drive
  backup file. Change it to `return true;` if wanted (as done here).
- More recordings: the words added in 1.0 and any new words need another Lingua Libre download (the same browser route).
