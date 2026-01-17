import { Link } from 'react-router-dom';
import { TonConnectButton } from '@tonconnect/ui-react';

const Home = () => {
    return (
        <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
            <h1>TON Connect Payment Demo</h1>
            <TonConnectButton />

            <div style={{ display: 'flex', gap: '20px' }}>
                <Link to="/usdt" style={{ textDecoration: 'none' }}>
                    <div style={{
                        border: '1px solid #ccc',
                        padding: '30px',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                        minWidth: '200px'
                    }}>
                        <h3>USDT Payment</h3>
                        <p>Jetton Transfer Split</p>
                    </div>
                </Link>

                <Link to="/ton" style={{ textDecoration: 'none' }}>
                    <div style={{
                        border: '1px solid #ccc',
                        padding: '30px',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                        minWidth: '200px'
                    }}>
                        <h3>TON Payment</h3>
                        <p>Native Coin Split</p>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default Home;
