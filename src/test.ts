import { Awtrix } from "./awtrix.js";
import { BilibiliApplication } from "./applications/bilibili.js";
import { WeatherApplication } from "./applications/weather.js";
import { BitcoinApplication } from "./applications/bitcoin.js";

const IP = "192.168.0.245";

const awtrix = new Awtrix(IP);

// Test power on and off
await awtrix.setPower(false);
await awtrix.setPower(true);

// Test showing text
await awtrix.showText(
    "Hello, Awtrix!",
    5,
    "#00FF00"
);

// Test weather
const weather = new WeatherApplication(awtrix, { location: '100000', secret: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX' });
await weather.start();
await weather.tick();
await weather.stop();

// Test Bitcoin
const bitcoin = new BitcoinApplication(awtrix, { target_currency: 'usd' });
await bitcoin.start();
await bitcoin.tick();
await bitcoin.stop();

// Test Bilibili
const bilibili = new BilibiliApplication(awtrix, { uid: 2 });
await bilibili.start();
await bilibili.tick();
await bilibili.stop();

// Test sound
await awtrix.playRtttl("ALARM:b=60:4c4.,8p.,4c4.,8p.,4c4.,8p.,4c4.,8p.,4c4.,8p.");

// Test mood light
await awtrix.setMoodlight({ brightness: 170, color: "#FF00FF" });
await awtrix.setMoodlight({});

// Test indicators
await awtrix.setIndicator(1, { color: "#FF0000", blink: 1000});
await awtrix.setIndicator(2, { color: "#00FF00", blink: 1000});
await awtrix.setIndicator(3, { color: "#0000FF", blink: 1000});

await new Promise(resolve => setTimeout(resolve, 5000));

await awtrix.hideIndicator(1);
await awtrix.hideIndicator(2);
await awtrix.hideIndicator(3);

// Test notifications (also applications)
await awtrix.sendNotification({
    text: "This is a notification",
    color: "#FFFF00",
    icon: "bilibili"
});

// Test reboot
await awtrix.reboot();

console.log("All tests completed.");