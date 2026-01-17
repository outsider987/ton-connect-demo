import { useState } from 'react';
import { TonConnectButton, useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { beginCell, Address, toNano } from '@ton/core';
import './App.css';

// --- 設定區 ---
// TON 測試網 (Testnet) USDT 合約地址 (Master Address)
const USDT_MASTER_ADDRESS = "kQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixDn7Nx2o_DZgW";
// Jetton 轉帳 OpCode
const JETTON_TRANSFER_OPCODE = 0xf8a7ea5;
// 創作者地址 (寫死)
const CREATOR_ADDRESS = "UQDa81-0T00_M5o2A6x4d8wE0G9e0g0R6G6E7v6R6_6E2v0_";
// 平台地址 (寫死)
const PLATFORM_ADDRESS = "UQDa81-0T00_M5o2A6x4d8wE0G9e0g0R6G6E7v6R6_6E2v0_";

// USDT 精度 (Decimals)
const USDT_DECIMALS = 6;

function App() {
  const [tonConnectUI] = useTonConnectUI();
  const userFriendlyAddress = useTonAddress(); // 取得用戶連接的錢包地址
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. 輔助函式：構建 Jetton 轉帳 Payload (二進位數據)
  const createJettonTransferBody = (recipient, amount) => {
    // 處理精度：將 1 USDT 轉為 1,000,000 (Micro-USDT)
    const amountInUnits = BigInt(Math.floor(amount * Math.pow(10, USDT_DECIMALS)));

    return beginCell()
      .storeUint(JETTON_TRANSFER_OPCODE, 32)
      .storeUint(0, 64) // query_id
      .storeCoins(amountInUnits)
      .storeAddress(Address.parse(recipient)) // 接收者
      .storeAddress(Address.parse(userFriendlyAddress)) // 響應地址 (餘額退回給用戶)
      .storeBit(0) // custom_payload
      .storeCoins(toNano('0.01')) // Forward amount (通知接收者的手續費)
      .storeBit(0) // forward_payload
      .endCell();
  };

  // 2. 輔助函式：透過 TonAPI 取得用戶的 Jetton 錢包地址
  const getUserJettonWallet = async (userAddress) => {
    try {
      // 使用測試網 API
      const response = await fetch(
        `https://testnet.tonapi.io/v2/accounts/${userAddress}/jettons?currencies=usd`
      );
      const data = await response.json();

      // 找到 USDT 資產
      // 實際應用中建議檢查 `jetton.address` 是否符合 USDT_MASTER_ADDRESS
      const usdtAsset = data.balances.find((b) =>
        b.jetton.address === "0:" + USDT_MASTER_ADDRESS.split(":")[1] || // 處理地址格式差異
        b.jetton.symbol === "USDT"
      );

      if (!usdtAsset) {
        console.log("找不到 USDT。資產列表:", data.balances);
        throw new Error("您的錢包中沒有 USDT (測試網)。");
      }
      return usdtAsset.wallet_address.address;
    } catch (e) {
      console.error("無法獲取 USDT 錢包:", e);
      return null;
    }
  };

  const handlePurchase = async () => {
    // 檢查是否已連接
    if (!userFriendlyAddress) {
      // 若未連接，喚起連接視窗
      tonConnectUI.openModal();
      return;
    }

    setIsProcessing(true);

    try {
      // A. 獲取用戶的 USDT 子錢包地址
      // 我們的轉帳指令必須發送給「用戶自己的 USDT 子錢包」，而不是直接發給接收者
      const myUsdtWallet = await getUserJettonWallet(userFriendlyAddress);
      if (!myUsdtWallet) {
        alert("無法獲取您的 USDT 錢包地址，請確認您持有測試網 (Testnet) USDT。");
        setIsProcessing(false);
        return;
      }

      console.log("您的 USDT 子錢包地址:", myUsdtWallet);

      // B. 定義接收者名單 (模擬 9.5 給創作者, 0.5 給平台)
      const recipients = [
        {
          address: "UQDa81-0T00_M5o2A6x4d8wE0G9e0g0R6G6E7v6R6_6E2v0_", // 創作者地址 (範例)
          amount: 9.5
        },
        {
          address: "UQDa81-0T00_M5o2A6x4d8wE0G9e0g0R6G6E7v6R6_6E2v0_", // 平台地址 (範例同上)
          amount: 0.5
        }
      ];

      // C. 構建交易陣列 (Messages)
      const messages = recipients.map((recipient) => ({
        address: myUsdtWallet, // 注意！！！目標地址是自己的子錢包
        amount: toNano('0.05').toString(), // 這是附帶的 Gas (TON)，每筆建議 0.05
        payload: createJettonTransferBody(
          recipient.address,
          recipient.amount
        ).toBoc().toString('base64')
      }));

      // D. 發送交易請求給錢包
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10分鐘有效
        messages: messages
      };

      console.log("正在發送交易:", transaction);
      const result = await tonConnectUI.sendTransaction(transaction);

      console.log("交易發送成功:", result);
      alert("交易已發送！請等待區塊鏈確認。");

    } catch (error) {
      console.error("交易失敗", error);
      alert("交易取消或失敗。");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <h1>TON Connect USDT 分帳範例</h1>

      {/* 官方連接按鈕 */}
      <TonConnectButton />

      <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '20px', borderRadius: '10px' }}>
        <h2>付費影片</h2>
        <p>價格: 10 USDT (測試網)</p>
        <p>分帳比例: 9.5 USDT (創作者) + 0.5 USDT (平台)</p>

        <button
          onClick={handlePurchase}
          disabled={isProcessing}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.7 : 1
          }}
        >
          {isProcessing ? "處理中..." : userFriendlyAddress ? "支付 10 USDT" : "連接錢包並支付"}
        </button>

        {userFriendlyAddress && (
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            您的地址: {userFriendlyAddress.slice(0, 4)}...{userFriendlyAddress.slice(-4)}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
