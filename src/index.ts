import cron from 'cron';
import { Awtrix } from './awtrix.js';
import { BilibiliApplication } from './applications/bilibili.js';
import { BaseApplication } from './applications/base.js';



const awtrix = new Awtrix('192.168.1.141');

const apps: BaseApplication[] = [
    new BilibiliApplication(awtrix, {
        uid: 521343512
    })
];

const jobs = [];

for (const app of apps) {
    await app.start();
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
    }

    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
});