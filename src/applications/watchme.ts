import got, { Got } from 'got';
import { Awtrix } from '../awtrix.js';
import { BaseApplication } from './base.js';

export class WatchmeApplication extends BaseApplication {
    private awtrixUrl: string;
    private watchmeUrl: string;
    private token: string;
    private watchme: Got;

    constructor(awtrix: Awtrix, _config: any) {
        super(awtrix, _config);
        this.interval = _config.interval || '* * * * *';
        this.awtrixUrl = _config.awtrix_url;
        this.watchmeUrl = _config.watchme_url;
        this.token = _config.watchme_token;
        this.watchme = got.extend({
            prefixUrl: this.watchmeUrl,
            hooks: {
                beforeRequest: [
                    (options: any) => {
                        options.searchParams = {
                            token: this.token
                        };
                    }
                ]
            }
        });
    }

    async start(): Promise<void> { }
    async tick(): Promise<void> {
        const response = await got<{ matrix: boolean, lux: number }>(`${this.awtrixUrl}/api/stats`, {
            responseType: 'json'
        }).catch(() => null);

        // Offline
        if (!response) {
            await this.watchme.post('/api/v1/status', {
                json: {
                    status: 0,
                }
            });
            return;
        }

        const data = response.body;
        const isScreenOn = data.matrix;
        const lux = data.lux;
        await this.watchme.post('/api/v1/status', {
            json: {
                status: isScreenOn ? 1 : 2,
            }
        });
        await this.watchme.post('/api/v1/message', {
            json: {
                message: `Environment brightness: ${lux}lux`,
            }
        });
    }
    async stop(): Promise<void> { }
}