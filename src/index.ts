import { Awtrix } from './awtrix.js';

import cron from 'cron';
import env from 'env-var';
import dotenv from 'dotenv';

import { BaseApplication } from './applications/base.js';
import { BilibiliApplication } from './applications/bilibili.js';
import { BitcoinApplication } from './applications/bitcoin.js';
import { WeatherApplication } from './applications/weather.js';
import { ServerApplication } from './applications/server.js';

import * as readline from 'readline';
import vm from 'vm';
import { TelegramApplication } from './applications/telegram.js';

function getApps() {
    const dict = {
        bilibili: BilibiliApplication,
        bitcoin: BitcoinApplication,
        weather: WeatherApplication,
        server: ServerApplication,
        telegram: TelegramApplication
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
const jobs: cron.CronJob[] = [];

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

class CodeExecutor {
    private rl: readline.Interface;
    private context: any;

    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.context = {
            console,
            setTimeout,
            setInterval,
            clearTimeout,
            clearInterval,
            Buffer,
            Math,
            JSON,
            Date,
            apps,
            jobs,
            awtrix,
            process
        };

        vm.createContext(this.context);
    }

    private executeCode(code: string): any {
        try {
            const script = new vm.Script(code);
            const result = script.runInContext(this.context, {
                timeout: 5000,
                displayErrors: true
            });
            return result;
        } catch (error: any) {
            throw new Error(`Error: ${error.message}`);
        }
    }

    private question(prompt: string): Promise<string> {
        return new Promise((resolve) => {
            this.rl.question(prompt, resolve);
        });
    }

    // REPL
    async startREPL(): Promise<void> {
        console.log('JavaScript interactive shell started.');
        console.log('Enter your code below. Type "exit" or "quit" to leave.');
        console.log('----------------------------');

        while (true) {
            try {
                const input = await this.question('>>> ');

                if (input === 'exit' || input === 'quit') break;
                if (!input.trim()) continue;

                const result = this.executeCode(input);

                if (result !== undefined) {
                    console.log('Result:', result);
                }

            } catch (error: any) {
                console.error('Error:', error.message);
            }
        }

        this.close();
    }

    close(): void {
        this.rl.close();
        console.log('Goodbye!');
    }
}

const promise = new Promise<void>((resolve) => {
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

if (env.get('ENABLE_REPL').default('0').asBool()) {
   while (true) await new CodeExecutor().startREPL();
}

await promise;