import { Awtrix } from "../awtrix.js";

export abstract class BaseApplication {
    protected awtrix: Awtrix;
    public interval: string | null; // crontab

    constructor(awtrix: Awtrix, _data: any) {
        this.awtrix = awtrix;
        this.interval = _data.interval || '* * * * *';
    }
    abstract start(): Promise<void>;
    abstract tick(): Promise<void>;
    abstract stop(): Promise<void>;
}