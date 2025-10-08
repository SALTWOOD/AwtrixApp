import got from "got";
import { BaseApplication } from "./base.js";
import { Awtrix } from "../awtrix.js";

class WeatherService {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async getWeather(location: any): Promise<any> {
        const params = new URLSearchParams({
            'source': 'pc',
            'weather_type': 'observe|forecast_1h',
            'province': location.province || '',
            'city': location.city || '',
            'county': location.county || ''
        });

        const url = `https://wis.qq.com/weather/common?key=${this.apiKey}&${params}`;

        try {
            const response = await got<{ data?: { observe?: any; } }>(url, { responseType: "json" });
            const data = response.body;

            if (!data || !data.data) {
                throw new Error('Invalid response from weather service');
            }

            const observe = data?.data?.observe || {};

            return {
                degree: observe.degree || 'N/A',
                weather: observe.weather || 'Unknown',
                humidity: observe.humidity || '--',
            };

        } catch (error: any) {
            throw new Error(`Weather service unavailable: ${error.message}`);
        }
    }
}

export class WeatherApplication extends BaseApplication {
    private weatherService: WeatherService;
    private location: string;

    constructor(awtrix: Awtrix, _config: any) {
        super(awtrix, _config);
        this.weatherService = new WeatherService(_config.secret);
        this.location = _config.location;
        this.interval = _config.interval || '*/10 * * * *';
    }

    async start(): Promise<void> { }

    async tick(): Promise<void> {
        const locParts = this.location.split(',');
        const location = {
            province: locParts[0] || '',
            city: locParts[1] || '',
            county: locParts[2] || ''
        };
        const weatherData = await this.weatherService.getWeather(location);
        await this.awtrix.createCustomApp(
            "weather-temp",
            {
                text: `${weatherData.degree}°C`,
                color: "#FFFFFF",
                icon: "weather"
            }
        );
        await this.awtrix.createCustomApp(
            "weather-humidity",
            {
                text: `${weatherData.humidity}%`,
                color: "#FFFFFF",
                icon: "humidity"
            }
        );
    }

    async stop(): Promise<void> { }
}