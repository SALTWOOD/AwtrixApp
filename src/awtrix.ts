import got, { Response } from 'got';

type Color = string | [number, number, number];
type DrawingCommand = 'dp' | 'dl' | 'dr' | 'df' | 'dc' | 'dfc' | 'dt' | 'db';
type OverlayEffect = 'clear' | 'snow' | 'rain' | 'drizzle' | 'storm' | 'thunder' | 'frost';
type TimeFormat = '%H:%M:%S' | '%l:%M:%S' | '%H:%M' | '%H %M' | '%l:%M' | '%l %M' | '%l:%M %p' | '%l %M %p';
type DateFormat = '%d.%m.%y' | '%d.%m' | '%y-%m-%d' | '%m-%d' | '%m/%d/%y' | '%m/%d' | '%d/%m/%y' | '%d/%m' | '%m-%d-%y';
type TransitionEffect = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

interface StatsResponse {
    [key: string]: any;
}

interface MoodlightData {
    brightness?: number;
    kelvin?: number;
    color?: Color;
}

interface IndicatorData {
    color: Color;
    blink?: number;
    fade?: number;
}

interface TextFragment {
    t: string;
    c: string;
}

interface DrawingInstruction {
    [key: string]: any[];
}

interface CustomAppData {
    text?: string | TextFragment[];
    textCase?: number;
    topText?: boolean;
    textOffset?: number;
    center?: boolean;
    color?: Color;
    gradient?: Color[];
    blinkText?: number;
    fadeText?: number;
    background?: Color;
    rainbow?: boolean;
    icon?: string;
    pushIcon?: number;
    repeat?: number;
    duration?: number;
    hold?: boolean;
    sound?: string;
    rtttl?: string;
    loopSound?: boolean;
    bar?: number[];
    line?: number[];
    autoscale?: boolean;
    barBC?: Color;
    progress?: number;
    progressC?: Color;
    progressBC?: Color;
    pos?: number;
    draw?: DrawingInstruction[];
    lifetime?: number;
    lifetimeMode?: number;
    stack?: boolean;
    wakeup?: boolean;
    noScroll?: boolean;
    clients?: string[];
    scrollSpeed?: number;
    effect?: string;
    effectSettings?: { [key: string]: any };
    save?: boolean;
    overlay?: OverlayEffect;
}

interface SettingsData {
    ATIME?: number;
    TEFF?: TransitionEffect;
    TSPEED?: number;
    TCOL?: Color;
    TMODE?: number;
    CHCOL?: Color;
    CBCOL?: Color;
    CTCOL?: Color;
    WD?: boolean;
    WDCA?: Color;
    WDCI?: Color;
    BRI?: number;
    ABRI?: boolean;
    ATRANS?: boolean;
    CCORRECTION?: [number, number, number];
    CTEMP?: [number, number, number];
    TFORMAT?: TimeFormat;
    DFORMAT?: DateFormat;
    SOM?: boolean;
    CEL?: boolean;
    BLOCKN?: boolean;
    UPPERCASE?: boolean;
    TIME_COL?: Color;
    DATE_COL?: Color;
    TEMP_COL?: Color;
    HUM_COL?: Color;
    BAT_COL?: Color;
    SSPEED?: number;
    TIM?: boolean;
    DAT?: boolean;
    HUM?: boolean;
    TEMP?: boolean;
    BAT?: boolean;
    MATP?: boolean;
    VOL?: number;
    OVERLAY?: OverlayEffect;
}

type AwtrixResponse = string | Record<string, any>;

class Awtrix {
    private baseUrl: string;

    /**
     * Initialize Awtrix device connection
     * 
     * @param ip - Device IP address
     * @param host - Optional host address, defaults to http://{ip}/api
     */
    constructor(ip: string, host?: string) {
        this.baseUrl = host || `http://${ip}/api`;
    }

    /**
     * Send HTTP request to Awtrix device
     * 
     * @param endpoint - API endpoint
     * @param method - HTTP method
     * @param data - Request body data
     * @param params - Query parameters
     * @returns Response data as string or parsed JSON
     */
    private async request(
        endpoint: string,
        method: 'GET' | 'POST' = 'GET',
        data?: any,
        params?: Record<string, string>
    ): Promise<AwtrixResponse> {
        const options: any = {
            method,
            timeout: { request: 10000 },
        };

        if (data) {
            options.json = data;
        }

        if (params) {
            options.searchParams = params;
        }

        const response: Response = await got(`${this.baseUrl}${endpoint}`, options);

        // Handle both JSON and text responses
        try {
            // Try to parse as JSON first
            return JSON.parse(response.body as any);
        } catch {
            // If parsing fails, return as string
            return response.body as string;
        }
    }

    /**
     * Send HTTP request and expect JSON response
     */
    private async requestJson<T>(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any, params?: Record<string, string>): Promise<T> {
        const result = await this.request(endpoint, method, data, params);
        if (typeof result === 'string') {
            throw new Error(`Expected JSON response but got string: ${result}`);
        }
        return result as T;
    }

    /**
     * Send HTTP request and expect string response
     */
    private async requestText(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any, params?: Record<string, string>): Promise<string> {
        const result = await this.request(endpoint, method, data, params);
        if (typeof result !== 'string') {
            throw new Error(`Expected string response but got JSON: ${JSON.stringify(result)}`);
        }
        return result;
    }

    // Status retrieval methods - these return JSON
    async getStats(): Promise<StatsResponse> {
        return this.requestJson<StatsResponse>('/stats');
    }

    async getEffects(): Promise<string[]> {
        return this.requestJson<string[]>('/effects');
    }

    async getTransitions(): Promise<string[]> {
        return this.requestJson<string[]>('/transitions');
    }

    async getLoop(): Promise<string[]> {
        return this.requestJson<string[]>('/loop');
    }

    // Power control methods - these return strings like "OK"
    async setPower(power: boolean): Promise<string> {
        return this.requestText('/power', 'POST', { power });
    }

    async setSleep(seconds: number): Promise<string> {
        return this.requestText('/sleep', 'POST', { sleep: seconds });
    }

    // Sound playback methods - these return strings
    async playSound(sound: string): Promise<string> {
        return this.requestText('/sound', 'POST', { sound });
    }

    async playRtttl(rtttlString: string): Promise<string> {
        return this.requestText('/rtttl', 'POST', rtttlString);
    }

    // Mood light control - returns string
    async setMoodlight(config: MoodlightData): Promise<string> {
        return this.requestText('/moodlight', 'POST', Object.keys(config).length > 0 ? config : undefined);
    }

    // Indicator control - returns string
    async setIndicator(indicatorNum: 1 | 2 | 3, config: IndicatorData): Promise<string> {
        if (![1, 2, 3].includes(indicatorNum)) {
            throw new Error('Indicator number must be 1, 2, or 3');
        }
        return this.requestText(`/indicator${indicatorNum}`, 'POST', config);
    }

    async hideIndicator(indicatorNum: 1 | 2 | 3): Promise<string> {
        return this.setIndicator(indicatorNum, { color: [0, 0, 0] });
    }

    // Custom apps and notifications - return strings
    async createCustomApp(appName: string, data: CustomAppData): Promise<string> {
        return this.requestText('/custom', 'POST', data, { name: appName });
    }

    async sendNotification(data: CustomAppData): Promise<string> {
        return this.requestText('/notify', 'POST', data);
    }

    async dismissNotification(): Promise<string> {
        return this.requestText('/notify/dismiss', 'POST');
    }

    // App switching - return strings
    async nextApp(): Promise<string> {
        return this.requestText('/nextapp', 'POST');
    }

    async previousApp(): Promise<string> {
        return this.requestText('/previousapp', 'POST');
    }

    async switchToApp(appName: string): Promise<string> {
        return this.requestText('/switch', 'POST', { name: appName });
    }

    // Settings management - GET returns JSON, POST returns string
    async getSettings(): Promise<SettingsData> {
        return this.requestJson<SettingsData>('/settings');
    }

    async updateSettings(settings: SettingsData): Promise<string> {
        return this.requestText('/settings', 'POST', settings);
    }

    // Device management - return strings
    async reboot(): Promise<string> {
        return this.requestText('/reboot', 'POST');
    }

    async updateFirmware(): Promise<string> {
        return this.requestText('/doupdate', 'POST');
    }

    async erase(): Promise<string> {
        return this.requestText('/erase', 'POST');
    }

    async resetSettings(): Promise<string> {
        return this.requestText('/resetSettings', 'POST');
    }

    // Screen related - returns JSON
    async getScreen(): Promise<any> {
        return this.requestJson('/screen');
    }

    // Convenience methods
    async turnOn(): Promise<string> {
        return this.setPower(true);
    }

    async turnOff(): Promise<string> {
        return this.setPower(false);
    }

    async showText(
        text: string,
        duration: number = 5,
        color?: string,
        icon?: string,
        additionalData: Partial<CustomAppData> = {}
    ): Promise<string> {
        const data: CustomAppData = {
            text,
            duration,
            ...additionalData
        };

        if (color) {
            data.color = color;
        }
        if (icon) {
            data.icon = icon;
        }

        return this.sendNotification(data);
    }
}

// Export the class and interfaces for use in other modules
export {
    Awtrix,
    type Color,
    type CustomAppData,
    type SettingsData,
    type MoodlightData,
    type IndicatorData,
    type AwtrixResponse
};