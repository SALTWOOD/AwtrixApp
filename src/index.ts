import { Awtrix } from './awtrix.js';

import cron from 'cron';
import env from 'env-var';
import dotenv from 'dotenv';

import { BaseApplication } from './applications/base.js';
import { BilibiliApplication } from './applications/bilibili.js';
import { BitcoinApplication } from './applications/bitcoin.js';
import { WeatherApplication } from './applications/weather.js';
import got from 'got';

function getApps() {
    const dict = {
        bilibili: BilibiliApplication,
        bitcoin: BitcoinApplication,
        weather: WeatherApplication
    }
    const results = [];

    for (const [key, value] of Object.entries(dict)) {
        const enabled: boolean = env.get(`APP_${key.toUpperCase()}_ENABLED`).default(0).asBool();
        if (enabled) {
            console.log(`Loading application: ${key}`);
            const config = env.get(`APP_${key.toUpperCase()}_CONFIG`).default({}).asJsonObject();
            results.push(new value(awtrix, config));
        }
    }

    return results;
}

dotenv.config();

const awtrix = new Awtrix(env.get('AWTRIX_IP').required().asString());
const apps: BaseApplication[] = getApps();
const jobs = [];

for (const app of apps) {
    await app.start();
    await app.tick();
    console.log(`Started application: ${app.constructor.name}`);
}

for (const app of apps) {
    jobs.push(cron.CronJob.from({
        cronTime: app.interval,
        onTick: async () => {
            await app.tick()
            console.log(`Ticked application: ${app.constructor.name}`);
        },
        start: true,
        timeZone: process.env.TZ || 'UTC'
    }));
    console.log(`Scheduled application: ${app.constructor.name} with interval "${app.interval}"`);
}



console.log('Applications are running. Press Ctrl+C to stop.');
await new Promise<void>((resolve) => {
    async function stop() {
        console.log('Stopping applications...');
        for (const app of apps) {
            await app.stop();
            console.log(`Stopped application: ${app.constructor.name}`);
        }
        resolve();
        process.exit(0);
    }

    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
});