import { Awtrix } from "../awtrix.js";

export abstract class BaseApplication {
    protected awtrix: Awtrix;
    public interval: string | null; // crontab
    public readonly config: any;

    constructor(awtrix: Awtrix, _config: any) {
        this.awtrix = awtrix;
        this.config = _config;
        this.interval = _config.interval || '* * * * *';
    }
    abstract start(): Promise<void>;
    abstract tick(): Promise<void>;
    abstract stop(): Promise<void>;
}