# TON Connect 演示 (USDT & TON 支付)

這是一個 React 應用程式，展示如何整合 TON Connect 以實現：
- **USDT 轉帳** (Jetton)
- **原生 TON 轉帳** (分帳支付)

## 🚀 如何運行並支援錢包連接

為了使用手機錢包 (如 Telegram Wallet, Tonkeeper) 進行測試，應用程式必須能夠透過 HTTPS 公開存取。我們使用 **Localtunnel** 來達成此目的。

### 1. 啟動開發伺服器
```bash
pnpm dev
```

### 2. 啟動隧道 (在新的終端機視窗)
```bash
npx localtunnel --port 5174
```
*等待出現類似 `https://weak-worms-wink.loca.lt` 的網址。*

### 3. 繞過隧道警告頁面
Localtunnel 會透過一個警告頁面來保護網址。您需要輸入您的 **公開 IP (Public IP)** 來繞過它。

1.  **獲取您的公開 IP**:
    在終端機執行此指令：
    ```bash
    curl -s https://api.ipify.org
    ```
    *(或者直接訪問 [whatismyip.com](https://whatismyip.com))*

2.  **輸入密碼**:
    -   在瀏覽器中打開 localtunnel 提供的網址。
    -   將您的 IP 地址複製並貼上到 "Tunnel Password" 欄位中。
    -   點擊 "Click to Submit"。

### 4. 連接錢包
現在您可以使用手機錢包掃描應用程式中的 QR Code 進行連接。

## ⚠️ "Blocked Request" 錯誤排除
如果您看到全黑畫面並顯示 "Blocked request"，請確認您的 `vite.config.js` 已允許所有主機 (hosts)：
```javascript
server: {
  allowedHosts: true,
  host: true
}
```

## 功能
-   **/usdt**: 鑄造 (Mint) 測試用 USDT 並支付 0.1 USDT (分帳: 0.095 + 0.005)。
-   **/ton**: 支付 1 TON (分帳: 0.95 + 0.05)。

## 常用資訊 (Useful Info)
- **管理員錢包 (Admin Wallet)**: `0QDpi4DyMYYgXSm2bZwoXgCRrI9BnB-VtKNnrUSWti2S3gc3`
- **Mock USDT 合約地址**: `EQDkLEEFuf-9IWVPbRRCeURbAeV4mTnPdEqhUw_ZUeKGNT_C`
