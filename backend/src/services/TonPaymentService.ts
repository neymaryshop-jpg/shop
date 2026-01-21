// backend/src/services/TonPaymentService.ts
import { TonClient, Address, WalletContractV4, internal } from 'ton';
import { mnemonicToPrivateKey } from 'ton-crypto';
import { Pool } from 'pg';
import { RedisClientType } from 'redis';

export class TonPaymentService {
    private client: TonClient;
    private wallet: WalletContractV4;
    private pool: Pool;
    private redis: RedisClientType;
    private isListening = false;

    constructor(pool: Pool, redis: RedisClientType) {
        this.pool = pool;
        this.redis = redis;
    }

    async initialize() {
        const network = process.env.TON_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
        
        // Initialize TON Client
        this.client = new TonClient({
            endpoint: process.env.TON_API_URL || 'https://toncenter.com/api/v2/jsonRPC',
            apiKey: process.env.TON_API_KEY
        });

        // Initialize wallet from mnemonic
        const mnemonic = process.env.TON_WALLET_MNEMONIC!.split(' ');
        const key = await mnemonicToPrivateKey(mnemonic);
        const workchain = 0;
        
        this.wallet = WalletContractV4.create({ workchain, publicKey: key.publicKey });
        
        console.log('✅ TON Wallet initialized:', this.wallet.address.toString());
    }

    // Запуск листенера для входящих платежей
    async startPaymentListener() {
        if (this.isListening) return;
        this.isListening = true;

        console.log('🔍 Starting TON payment listener...');

        let lastProcessedLt = await this.getLastProcessedLT();

        setInterval(async () => {
            try {
                const transactions = await this.client.getTransactions(
                    this.wallet.address,
                    { limit: 10, lt: lastProcessedLt }
                );

                for (const tx of transactions) {
                    if (tx.inMessage && tx.inMessage.info.type === 'internal') {
                        await this.processIncomingPayment(tx);
                        lastProcessedLt = tx.lt;
                        await this.saveLastProcessedLT(lastProcessedLT);
                    }
                }
            } catch (error) {
                console.error('❌ Payment listener error:', error);
            }
        }, 5000); // Проверка каждые 5 секунд
    }

    private async processIncomingPayment(transaction: any) {
        const senderAddress = transaction.inMessage.info.src.toString();
        const amount = Number(transaction.inMessage.info.value.coins) / 1e9; // Nano TON to TON
        const comment = transaction.inMessage.body?.toString() || '';

        console.log(`💰 Incoming payment: ${amount} TON from ${senderAddress}`);

        // Извлекаем order_id из comment (формат: "ORDER_12345")
        const orderIdMatch = comment.match(/ORDER_(\d+)/);
        if (!orderIdMatch) {
            console.warn('⚠️ Payment without order ID:', comment);
            return;
        }

        const orderId = parseInt(orderIdMatch[1]);

        // Проверяем что транзакция не обработана (защита от replay)
        const txHash = transaction.hash().toString('hex');
        const exists = await this.redis.get(`ton:tx:${txHash}`);
        if (exists) {
            console.log('⏭️ Transaction already processed:', txHash);
            return;
        }

        // Обновляем заказ
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const orderResult = await client.query(
                `UPDATE orders 
                 SET status = 'confirmed', 
                     payment_status = 'received',
                     payment_transaction_id = $1,
                     updated_at = NOW()
                 WHERE id = $2 AND status = 'awaiting_confirmation'
                 RETURNING *`,
                [txHash, orderId]
            );

            if (orderResult.rows.length === 0) {
                console.warn(`⚠️ Order ${orderId} not found or already processed`);
                await client.query('ROLLBACK');
                return;
            }

            // Помечаем транзакцию как обработанную
            await this.redis.setEx(`ton:tx:${txHash}`, 86400, '1'); // 24h TTL

            await client.query('COMMIT');

            const order = orderResult.rows[0];
            console.log(`✅ Order ${orderId} confirmed with TON payment`);

            // Отправляем уведомление через WebSocket (см. ниже)
            this.notifyOrderConfirmation(orderId, amount, txHash);

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Failed to process payment:', error);
        } finally {
            client.release();
        }
    }

    private async getLastProcessedLT(): Promise<string> {
        const lt = await this.redis.get('ton:last_lt');
        return lt || '0';
    }

    private async saveLastProcessedLT(lt: string) {
        await this.redis.set('ton:last_lt', lt);
    }

    // Генерация платежной ссылки для пользователя
    generatePaymentLink(orderId: number, amount: number): string {
        const comment = `ORDER_${orderId}`;
        const tonAmount = amount; // Уже в TON
        
        // TON Connect deep link
        return `ton://transfer/${this.wallet.address.toString()}?amount=${tonAmount * 1e9}&text=${encodeURIComponent(comment)}`;
    }

    // Верификация платежа по hash (для manual check)
    async verifyTransaction(txHash: string): Promise<boolean> {
        try {
            const tx = await this.client.getTransaction(
                this.wallet.address,
                txHash
            );
            return tx !== null;
        } catch {
            return false;
        }
    }

    private notifyOrderConfirmation(orderId: number, amount: number, txHash: string) {
        // Интеграция с WebSocket (см. обновленный backend/src/index.ts)
    }
}