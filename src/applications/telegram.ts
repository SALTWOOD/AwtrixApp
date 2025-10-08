import { Bot } from "gramio";
import { Awtrix } from "../awtrix.js";
import { BaseApplication } from "./base.js";

const HELP_TEXT = {
    start:
        `Hello! I'm an Awtrix bot.
You can use me to notify my owner's Awtrix device.

Commands:
/start - Show this message
/help <command_name> - Show this message
/ping - Check if I'm alive
/notify <message> - Send a notification to the Awtrix device (English only)
/alarm - Make the device ring`,
    ping: `Command /ping:
Check if I'm alive. I'll reply with "Pong!" if I am.`,
    notify: `Command /notify <message>:
Send a notification to the Awtrix device. This message should be in English only, and have a cooldown of 5 minutes.`,
    alarm: `Command /alarm:
Make the device ring. This command has a cooldown of 10 minutes.`
}

export class TelegramApplication extends BaseApplication {
    private bot: Bot;
    private openTime: number[][][];

    constructor(awtrix: Awtrix, _config: any) {
        super(awtrix, _config);
        this.interval = null;
        this.openTime = _config.openTime || [[[0, 0], [23, 59]]]; // Always open by default

        this.bot = new Bot(_config.token, {
            api: _config.api || undefined
        });

        this.bot
            .command("start", (ctx) => ctx.reply(HELP_TEXT.start))
            .command("help", async (ctx) => {
                const args = ctx.text?.split(' ') || [];
                if (args.length < 2) {
                    return await ctx.reply(HELP_TEXT.start);
                }
                const command = args[1].toLowerCase();
                if (command in HELP_TEXT) {
                    return await ctx.reply((HELP_TEXT as any)[command]);
                } else {
                    return await ctx.reply(`Unknown command: ${command}`);
                }
            })
            .command("ping", (ctx) => ctx.reply("Pong!"))
            .command("notify", async (ctx) => {
                const args = ctx.text?.split(' ') || [];
                if (args.length < 2) {
                    return await ctx.reply(HELP_TEXT.notify);
                }
                const message = args.slice(1).join(' ');
                // Send the notification to the Awtrix device
                console.log(`Notification command received from user ${ctx.from?.username} (${ctx.from?.id})`);
                await this.awtrix.sendNotification({
                    text: message,
                    color: "#FFFFFF",
                    icon: "telegram",
                    repeat: 3
                });
                await ctx.reply(`Notification sent: ${message}`);
            })
            .command("alarm", async (ctx) => {
                // Make the device ring
                console.log(`Alarm command received from user ${ctx.from?.username} (${ctx.from?.id})`);
                if (!this.isWithinOpenTime()) {
                    return ctx.reply(`Sorry, the alarm command is not available at this time.\n${this.getOpenTimeText()}`);
                }
                await this.awtrix.playRtttl("ALARM:b=60:4c4.,8p.,4c4.,8p.,4c4.,8p.,4c4.,8p.,4c4.,8p.");
                return await ctx.reply("Alarm triggered!");
            });
    }

    private getOpenTimeText(): string {
        const parts = this.openTime.map(([[sh, sm], [eh, em]]) => {
            const start = `${sh.toString().padStart(2, '0')}:${sm.toString().padStart(2, '0')}`;
            const end = `${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}`;
            return `${start} - ${end}`;
        });
        return `The command can be used between the following times (${Intl.DateTimeFormat().resolvedOptions().timeZone}):\n${parts.join('\n')}`;
    }

    private isWithinOpenTime(): boolean {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const currentTotalMinutes = hour * 60 + minute;

        for (const [[startHour, startMinute], [endHour, endMinute]] of this.openTime) {
            const startTotalMinutes = startHour * 60 + startMinute;
            const endTotalMinutes = endHour * 60 + endMinute;

            if (currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes) {
                return true;
            }
        }
        return false;
    }

    async start(): Promise<void> {
        await this.bot.start();
        console.log('Telegram bot started');
    }

    async tick(): Promise<void> {
    }

    async stop(): Promise<void> {
        await this.bot.stop();
        console.log('Telegram bot stopped');
    }
}