# 🌸 花花補給站 · Pikmin Bloom 四人庫存網站

**這是可以直接部署的靜態網站原始碼，不是已經替你上線的網址。**

## 開始使用（不設定雲端也能先試）

- 直接開啟 `index.html`，使用「本機體驗模式」。庫存會存到這台裝置的瀏覽器 `localStorage`，重新整理仍保留；不同手機**不會**互相同步，清除瀏覽資料可能遺失。
- 如遇到瀏覽器限制，建議使用本機靜態伺服器：在資料夾執行 `python -m http.server 8000`，然後開啟 `http://localhost:8000`。
- 上方的四位玩家預設名稱可以在「設定與備份」修改。

## 部署到 GitHub Pages

1. 在 GitHub 新增 repository（例如 `pikmin-flowers`）。
2. 上傳 `index.html`、`style.css`、`app.js`、`README.md`，以及 `supabase.sql`（SQL 不含密碼，可留在 repo；不要上傳自己的金鑰或密碼）。
3. GitHub repo → **Settings → Pages** → Build and deployment → **Deploy from a branch** → `main` / `/(root)` → **Save**。
4. 等 Pages 完成部署後，開啟顯示的網站網址。未登入雲端前，每個人看到的是各自裝置的本機資料。

## 讓四個人跨手機同步：設定 Supabase

1. 在 Supabase 建立專案。
2. 在 **SQL Editor** 貼入 `supabase.sql` 並執行。它會建立 4 位玩家、inventory、history，以及只允許核准成員存取的 Row Level Security（RLS）政策。
3. 到 SQL Editor 執行下列 SQL，**把所有 Email 改成真正的四位成員信箱**：

   ```sql
   insert into public.allowed_members(email) values
   ('friend1@example.com'),
   ('friend2@example.com'),
   ('friend3@example.com'),
   ('friend4@example.com')
   on conflict(email) do nothing;
   ```

4. Supabase Dashboard → **Authentication → Users**，為四位成員建立／邀請帳號，確保信箱已確認且已設定密碼。為避免陌生人註冊，建議在 Authentication 設定關閉公開 Email sign-up，只由管理員邀請四位使用者。
5. Supabase Dashboard → **Project Settings / API Keys** 或 **Connect**，複製 **Project URL** 和 **publishable key / anon public key**。
6. 網站 → **設定與備份** → 貼上 Project URL 與 publishable / anon key → **儲存雲端設定並連線** → 輸入其中一位獲准成員的 Email 和密碼 → **登入雲端**。
7. 其他三人開啟**同一 GitHub Pages 網址**，填入相同 Project URL 與同一個公開金鑰，各自用自己的 Email 和密碼登入。四人可以互相編輯全部四份庫存。

> ⚠️ **絕不**填入 Supabase `service_role`、`sb_secret_...`、資料庫連線密碼。網站前端只能使用 publishable / anon 公開金鑰。這份 SQL 的存取規則會檢查登入者 Email 是否列在 allowlist 中；未授權帳號即使知道網址也不能讀寫資料。若名單要更改，管理員使用 SQL Editor 修改 `allowed_members`。

> ⚠️ Supabase 免費額度與閒置專案限制可能調整。資料請定期下載 CSV 備份。**本機資料不會在雲端登入時自動搬過去**；先下載 CSV，雲端登入後再匯入 CSV。

## 使用方式

- **庫存總覽**：查詢、色系篩選、選擇單人或四人比較；點數字進入修改視窗。`—` 是尚未登記，`0` 是零庫存。
- **文字批量貼上**：每行輸入 `花名 花瓣 精華`，例如：

  ```text
  白色彼岸花 1200 942
  黃色彼岸花 1200 671
  紅色彼岸花 1172 1094
  精華 1200 1200
  黃色精華 1200 1200
  ```

  若只輸入花瓣，在第一行寫 `花瓣`，再寫 `白彼岸花300` 等。精華亦同。
- **Excel / Google Sheets**：複製三欄 `花名 / 花瓣 / 精華`，直接貼上網頁即可。空白欄位不會覆蓋原值。
- **截圖辨識（實驗性）**：一次選取多張 iPhone / Android 截圖，讓 Tesseract.js 在瀏覽器讀取繁體中文與數字，嘗試以四欄佈局關聯花朵、上方花瓣和右下角精華。OCR **不保證辨識完整或正確**：文字可能漏行或認錯、相同花朵可能跨截圖重複。**儲存前一定要逐筆核對預覽**，未辨識到的花朵不會被改為零。
- **名稱轉換**：`精華 → 普白`、`黃色精華 → 普黃`、`紅色精華 → 普紅`、`藍色精華 → 普藍`。特殊花維持原名稱。
- **更新紀錄**：本機儲存最近 500 筆異動，雲端由資料庫 trigger 記錄歷史，頁面顯示最新 100 筆。
- **CSV 備份**：可下載並還原四人資料，還原之前會跳出確認視窗。請避免把真正的庫存與測試資料混淆。

## 注意與已知限制

- 這版的 OCR 是**原型功能**，未針對所有花朵截圖做過系統性準確率驗證。尤其跨排、左右截斷的名稱、圖片底部被導航列擋住的文字、灰色淡字、不同字體都可能讓 OCR 錯誤。它的用途是**提供待確認的候選數字**，不是無須檢查的一鍵全自動同步。
- 第一次 OCR 會從網路載入 Tesseract.js 與 `chi_tra` 語言模型；手機辨識多張圖可能費時、耗記憶體。可分批處理。
- 兩人同時修改**同一朵花、同一筆資料**時，較晚送出的整筆更新可能覆蓋先前變更；資料庫歷史記錄保留先後狀態，並非即時協作的衝突合併引擎。需要時手動重新整理頁面。
- 網站不連結 Pikmin Bloom 帳號，不會自動讀取遊戲內庫存。
- 所有外部 JS 由 CDN 載入，使用 OCR 與 Supabase 功能需要網路。
- GitHub Pages 是公開存取的靜態頁面；**庫存隱私與寫入權限由 Supabase Authentication + RLS 保障**。請勿把敏感資訊放進原始碼。

## 專案檔案

- `index.html` — 網站內容與 UI
- `style.css` — 響應式版面
- `app.js` — 庫存、文字/表格/截圖批量匯入、Supabase 資料同步、CSV
- `supabase.sql` — 建表、觸發器、RLS 存取規則

Made for four flower keepers ♡ 非任天堂官方服務。
