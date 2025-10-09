import { Awtrix } from "../awtrix.js";
import { BaseApplication } from "./base.js";
import si, { mem } from 'systeminformation';

export class ServerApplication extends BaseApplication {
    constructor(awtrix: Awtrix, _config: any) {
        super(awtrix, _config);
        this.interval = _config.interval || '*/5 * * * * *';
    }

    async start(): Promise<void> { }

    async tick(): Promise<void> {
        const memory = await si.mem();
        let memoryPercent = (memory.active * 100 / memory.total);
        let text = memoryPercent >= 99.995 ? '100' : Math.min(memoryPercent, 99.99).toFixed(2);
        await this.awtrix.createCustomApp(
            "server-cpu",
            {
                text: `${text}%`,
                color: "#FFFFFF",
                icon: "memory"
            }
        );

        const load = await si.currentLoad();
        const loadPercent = load.currentLoad.toFixed(2);
        await this.awtrix.createCustomApp(
            "server-memory",
            {
                text: `${loadPercent}%`,
                color: "#FFFFFF",
                icon: "server"
            }
        );
    }

    async stop(): Promise<void> { }
}