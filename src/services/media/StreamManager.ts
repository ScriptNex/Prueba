import axios from 'axios';
import { PassThrough, Readable } from 'stream';
import { STREAM, TIMEOUTS } from '../../config/constants.js';

export class StreamManager {
    activeStreams: Map<number, any>;
    stats: { created: number; completed: number; failed: number };

    constructor() {
        this.activeStreams = new Map();
        this.stats = { created: 0, completed: 0, failed: 0 };
    }

    async getStream(url: string, options: any = {}): Promise<Readable> {
        const maxRetries = options.retries ?? STREAM.RETRY_ATTEMPTS;
        const timeout = options.timeout ?? TIMEOUTS.STREAM;
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const streamId = Date.now() + Math.random();
                this.stats.created++;

                const response = await axios({
                    method: 'GET',
                    url: url,
                    responseType: 'stream',
                    timeout: timeout,
                    maxContentLength: STREAM.MAX_SIZE,
                    maxBodyLength: STREAM.MAX_SIZE,
                    ...options
                });

                this.activeStreams.set(streamId, {
                    url,
                    startTime: Date.now()
                });

                response.data.on('end', () => {
                    this.activeStreams.delete(streamId);
                    this.stats.completed++;
                });

                response.data.on('error', () => {
                    this.activeStreams.delete(streamId);
                    this.stats.failed++;
                });

                return response.data;
            } catch (error) {
                lastError = error;
                if (attempt < maxRetries) {
                    const delay = STREAM.RETRY_DELAY * Math.pow(2, attempt - 1);
                    await new Promise(r => setTimeout(r, delay));
                }
            }
        }
        this.stats.failed++;
        throw lastError;
    }

    createPassThrough(sourceStream: Readable): PassThrough {
        const pass = new PassThrough();
        sourceStream.pipe(pass);
        return pass;
    }

    getActiveCount(): number {
        return this.activeStreams.size;
    }

    getStats() {
        return {
            ...this.stats,
            active: this.activeStreams.size
        };
    }
}

export default StreamManager;
