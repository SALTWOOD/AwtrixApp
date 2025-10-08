import got from "got";
import { Awtrix } from "../awtrix.js";
import { BaseApplication } from "./base.js";

export class BitcoinApplication extends BaseApplication {
    target_currency: string;

    constructor(awtrix: Awtrix, _config: any) {
        super(awtrix, _config);
        this.target_currency = _config.target_currency || 'usd';
        this.interval = _config.interval || '*/5 * * * *';
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
                text: rate.toString(),
                color: "#FEA500",
                icon: "bitcoin"
            }
        );
    }

    async stop(): Promise<void> { }
}