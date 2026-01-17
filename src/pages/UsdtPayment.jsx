import { useState } from 'react';
import { TonConnectButton, useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { beginCell, Address, toNano } from '@ton/core';

// --- 設定區 ---
// TON 測試網 (Testnet) USDT 合約地址 (Master Address)
const USDT_MASTER_ADDRESS = import.meta.env.VITE_USDT_MASTER_ADDRESS ?? "kQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixDn7Nx2o_DZgW";
let USDT_MASTER_RAW = null;
try {
    // Try both friendly and raw formats; throw later if invalid
    USDT_MASTER_RAW = Address.parse(USDT_MASTER_ADDRESS).toRawString();
} catch (err) {
    console.error("Invalid USDT master address. Set VITE_USDT_MASTER_ADDRESS to the official testnet USDT jetton address.", err);
}
const TONAPI_URL = 'https://testnet.tonapi.io';
const TONAPI_KEY = import.meta.env.VITE_TONAPI_KEY;
// Jetton 轉帳 OpCode
const JETTON_TRANSFER_OPCODE = 0xf8a7ea5;
const MINT_OPCODE = 21; // Mint OpCode for Standard Jetton
// 創作者地址 (寫死)
const CREATOR_ADDRESS = "UQDa81-0T00_M5o2A6x4d8wE0G9e0g0R6G6E7v6R6_6E2v0_";
// 平台地址 (寫死)
const PLATFORM_ADDRESS = "UQDa81-0T00_M5o2A6x4d8wE0G9e0g0R6G6E7v6R6_6E2v0_";

// USDT 精度 (Decimals)
const USDT_DECIMALS = 6;

const normalizeAddress = (addr) => {
    try {
        return Address.parse(addr).toRawString();
    } catch (_) {
        return addr;
    }
};

function UsdtPayment() {
    const [tonConnectUI] = useTonConnectUI();
    const userFriendlyAddress = useTonAddress(); // 取得用戶連接的錢包地址
    const [isProcessing, setIsProcessing] = useState(false);

    const ensureMasterAddress = () => {
        if (!USDT_MASTER_RAW) {
            throw new Error("USDT master address is invalid or missing. 請設定 VITE_USDT_MASTER_ADDRESS 為官方 testnet USDT 地址。");
        }
        return USDT_MASTER_RAW;
    };

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
            ensureMasterAddress();
            const response = await fetch(
                `${TONAPI_URL}/v2/accounts/${userAddress}/jettons?currencies=usd`,
                {
                    headers: TONAPI_KEY ? { 'X-API-Key': TONAPI_KEY } : undefined
                }
            );

            if (!response.ok) {
                console.error('TonAPI error:', response.status, response.statusText);
                throw new Error('TonAPI 回應錯誤，稍後再試');
            }

            const data = await response.json();
            const balances = Array.isArray(data?.balances) ? data.balances : [];

            // 找到 USDT 資產
            const usdtAsset = balances.find((b) => {
                const jettonAddr = b?.jetton?.address;
                if (!jettonAddr) return false;
                return normalizeAddress(jettonAddr) === USDT_MASTER_RAW;
            });

            if (!usdtAsset) {
                console.log("找不到 USDT。資產列表:", balances);
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

        if (!USDT_MASTER_RAW) {
            alert("USDT master address 無效。請在 .env 設定 VITE_USDT_MASTER_ADDRESS 為官方 testnet USDT 地址。");
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

            // B. 定義接收者名單 (模擬 0.095 給創作者, 0.005 給平台)
            const recipients = [
                {
                    address: "UQDa81-0T00_M5o2A6x4d8wE0G9e0g0R6G6E7v6R6_6E2v0_", // 創作者地址 (範例)
                    amount: 0.095
                },
                {
                    address: "UQDa81-0T00_M5o2A6x4d8wE0G9e0g0R6G6E7v6R6_6E2v0_", // 平台地址 (範例同上)
                    amount: 0.005
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

    const handleMint = async () => {
        if (!userFriendlyAddress) {
            tonConnectUI.openModal();
            return;
        }

        // Ensure 0.1 USDT amount logic for Minting? No, Minting is usually creating new tokens.
        // Standard Jetton Mint Body:
        // op::mint = 21
        // query_id: uint64
        // to_address: MsgAddressInt
        // ton_amount: VarUInteger 16 (Gas for notification/internal transfer)
        // master_msg: ^Cell  (Internal Transfer Body)
        //     op::internal_transfer = 0x178d4519
        //     query_id: uint64
        //     amount: VarUInteger 16
        //     from: MsgAddressInt
        //     response_address: MsgAddressInt
        //     forward_ton_amount: VarUInteger 16
        //     forward_payload: Either Cell ^Cell

        try {
            setIsProcessing(true);
            const masterAddr = ensureMasterAddress(); // Target is Master Contract

            const mintAmount = BigInt(1000 * Math.floor(Math.pow(10, USDT_DECIMALS))); // 1000 USDT

            const forwardPayload = beginCell().endCell(); // Empty

            const internalTransferBody = beginCell()
                .storeUint(0x178d4519, 32) // op::internal_transfer
                .storeUint(0, 64) // query_id
                .storeCoins(mintAmount)
                .storeAddress(Address.parse(userFriendlyAddress)) // from: (usually owner, or null)
                .storeAddress(Address.parse(userFriendlyAddress)) // response_address
                .storeCoins(toNano('0.01')) // forward_ton_amount
                .storeBit(0) // forward_payload: right (0) or left (1)? usually Maybe Ref depending on impl. 
                // Standard: Either <Cell, ^Cell>. 0 means inline Cell? No, Either X Y = (bit 0) X | (bit 1) Y
                // Actually standard storeBit(0) is often used for empty payload if it expects Either.
                .endCell();

            // Check if master_msg (internal_transfer) needs to be in a ref or inline.
            // Standard Jetton Minter (Steve Korshakov impl): 
            // mint#15 query_id:uint64 to_address:MsgAddressInt ton_amount:VarUInteger16 master_msg:^Cell = InternalMsgBody

            const mintBody = beginCell()
                .storeUint(21, 32) // op::mint
                .storeUint(0, 64) // query_id
                .storeAddress(Address.parse(userFriendlyAddress)) // to: mint to self
                .storeCoins(toNano('0.05')) // ton_amount (Gas for the jetton wallet to handle internal transfer)
                .storeRef(internalTransferBody) // master_msg (Must be a Ref)
                .endCell();

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 600,
                messages: [
                    {
                        address: Address.parse(masterAddr).toString(), // Convert to User-Friendly (EQ...) format
                        amount: toNano('0.1').toString(), // Amount to send to Master (mint fee + gas)
                        payload: mintBody.toBoc().toString('base64')
                    }
                ]
            };

            const result = await tonConnectUI.sendTransaction(transaction);
            alert("Minting transaction sent!");
        } catch (err) {
            console.error("Mint failed:", err);
            alert(`Mint failed. Details: ${err.message}\nTarget Master: ${USDT_MASTER_RAW}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <h1>TON Connect USDT 分帳範例</h1>

            <TonConnectButton />

            <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '20px', borderRadius: '10px' }}>
                <h2>付費影片</h2>
                <p>價格: 0.1 USDT (測試網)</p>
                <p>分帳比例: 0.095 USDT (創作者) + 0.005 USDT (平台)</p>

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
                    {isProcessing ? "處理中..." : userFriendlyAddress ? "支付 0.1 USDT" : "連接錢包並支付"}
                </button>

                {userFriendlyAddress && (
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                        您的地址: {userFriendlyAddress.slice(0, 4)}...{userFriendlyAddress.slice(-4)}
                    </div>
                )}

                <hr style={{ width: '100%', margin: '20px 0' }} />

                <h3>測試區 (需要 Admin 權限)</h3>
                <button
                    onClick={handleMint}
                    disabled={isProcessing}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: isProcessing ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isProcessing ? "處理中..." : "Mint 1000 Test USDT"}
                </button>
            </div>
        </div>
    )
}

export default UsdtPayment;
