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

    constructor(awtrix: Awtrix, _data: any) {
        super(awtrix, _data);
        this.interval = _data.interval || '*/5 * * * * *';
        this.bot = new Bot(_data.token, {
            api: _data.api || undefined
        });

        this.bot
            .command("start", (ctx) => ctx.reply(HELP_TEXT.start))
            .command("help", (ctx) => {
                const args = ctx.text?.split(' ') || [];
                if (args.length < 2) {
                    return ctx.reply(HELP_TEXT.start);
                }
                const command = args[1].toLowerCase();
                if (command in HELP_TEXT) {
                    return ctx.reply((HELP_TEXT as any)[command]);
                } else {
                    return ctx.reply(`Unknown command: ${command}`);
                }
            })
            .command("ping", (ctx) => ctx.reply("Pong!"))
            .command("notify", async (ctx) => {
                const args = ctx.text?.split(' ') || [];
                if (args.length < 2) {
                    return ctx.reply(HELP_TEXT.notify);
                }
                const message = args.slice(1).join(' ');
                // Send the notification to the Awtrix device
                await this.awtrix.sendNotification({
                    text: message,
                    color: "#FFFFFF",
                    icon: "telegram"
                });
                ctx.reply(`Notification sent: ${message}`);
            })
            .command("alarm", async (ctx) => {
                // Make the device ring
                await this.awtrix.playRtttl("ALARM:b=60:4c4.,8p.,4c4.,8p.,4c4.,8p.,4c4.,8p.,4c4.,8p.");
                ctx.reply("Alarm triggered!");
            });
    }


    async start(): Promise<void> {
        this.bot.start();
    }

    async tick(): Promise<void> {
    }

    async stop(): Promise<void> {
        this.bot.stop();
    }
}