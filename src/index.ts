import cron from 'cron';
import { Awtrix } from './awtrix.js';
import { BilibiliApplication } from './applications/bilibili.js';

async function stop() {
    console.log('Stopping applications...');
    for (const app of apps) {
        await app.stop();
        console.log(`Stopped application: ${app.constructor.name}`);
    }
}

const awtrix = new Awtrix('192.168.1.141');

const apps = [
    new BilibiliApplication(awtrix, {
        uid: 521343512,
        interval: 300
    })
];

const jobs = [];

for (const app of apps) {
    await app.start();
    console.log(`Started application: ${app.constructor.name}`);
}

for (const app of apps) {
    jobs.push(new cron.CronJob(app.interval, app.tick.bind(app), null, true, process.env.TZ || 'UTC'));
    console.log(`Scheduled application: ${app.constructor.name} with interval "${app.interval}"`);
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);

console.log('Applications are running. Press Ctrl+C to stop.');