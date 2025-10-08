import got from 'got';
import { Awtrix } from '../awtrix.js';
import { BaseApplication } from './base.js';

export class BilibiliApplication extends BaseApplication {
    uid: number;

    constructor(awtrix: Awtrix, _config: any) {
        super(awtrix, _config);
        this.uid = _config.uid;
        this.interval = _config.interval || '*/5 * * * *';
    }

    async start(): Promise<void> { }
    async tick(): Promise<void> {
        const response = await got('https://api.bilibili.com/x/relation/stat', {
            searchParams: {
                vmid: this.uid,
                jsonp: 'jsonp'
            },
            responseType: 'json'
        });

        const data = response.body as any;
        const follower = data.data.follower;

        await this.awtrix.createCustomApp(
            "bilibili",
            {
                text: follower.toString(),
                color: "#FFFFFF",
                icon: "bilibili"
            }
        )
    }
    async stop(): Promise<void> { }
}