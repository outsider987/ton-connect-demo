import { useState } from 'react';
import { TonConnectButton, useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { toNano, Address } from '@ton/core';

const CREATOR_ADDRESS = "0QBt1ncs-5sxTc_4Co5RW-HfLre73ZTnjMPmE_MMLOdQ6THB";
const PLATFORM_ADDRESS = "0QBt1ncs-5sxTc_4Co5RW-HfLre73ZTnjMPmE_MMLOdQ6THB";

const TonPayment = () => {
    const [tonConnectUI] = useTonConnectUI();
    const userFriendlyAddress = useTonAddress();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleTonPayment = async () => {
        if (!userFriendlyAddress) {
            tonConnectUI.openModal();
            return;
        }

        setIsProcessing(true);

        try {
            // Total: 1 TON
            // Split: 0.95 TON (Creator) + 0.05 TON (Platform)

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 600,
                messages: [
                    {
                        address: Address.parse(CREATOR_ADDRESS).toString({ testOnly: true, bounceable: false }),
                        amount: toNano('0.95').toString()
                    },
                    {
                        address: Address.parse(PLATFORM_ADDRESS).toString({ testOnly: true, bounceable: false }),
                        amount: toNano('0.05').toString()
                    }
                ]
            };

            await tonConnectUI.sendTransaction(transaction);
            alert("TON Payment sent successfully!");

        } catch (e) {
            console.error(e);
            alert("Payment failed: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <h1>TON Coin Split Payment (Testnet)</h1>
            <TonConnectButton />

            <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '20px', borderRadius: '10px' }}>
                <h2>Pay 1 TON</h2>
                <p>Split: 0.95 TON (Creator) + 0.05 TON (Platform)</p>
                <button
                    onClick={handleTonPayment}
                    disabled={isProcessing}
                    style={{
                        padding: '10px 20px',
                        fontSize: '16px',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        backgroundColor: '#0088CC',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px'
                    }}
                >
                    {isProcessing ? "Processing..." : "Pay 1 TON"}
                </button>
            </div>
        </div>
    );
};

export default TonPayment;
