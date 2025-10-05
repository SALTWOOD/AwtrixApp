import got from "got";
import { Awtrix } from "../awtrix.js";
import { BaseApplication } from "./base.js";

export class BitcoinApplication extends BaseApplication {
    target_currency: string;

    constructor(awtrix: Awtrix, _data: any) {
        super(awtrix, _data);
        this.target_currency = _data.target_currency || 'usd';
        this.interval = _data.interval || '*/5 * * * *';
    }

    async start(): Promise<void> { }

    async tick(): Promise<void> {
        const response = await got<{ bitcoin: { [key: string]: number } }>(`https://api.coingecko.com/api/v3/simple/price`, {
            searchParams: {
                ids: 'bitcoin',
                vs_currencies: this.target_currency
            },
            responseType: 'json'
        });
        const data = response.body;
        const rate = data['bitcoin'][this.target_currency];

        await this.awtrix.createCustomApp(
            "bitcoin-price",
            {
                text: `${rate} ${this.target_currency.toUpperCase()}`,
                color: "#F7931A",
                icon: "bitcoin"
            }
        );
    }

    async stop(): Promise<void> { }
}