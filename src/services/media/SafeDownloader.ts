import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createWriteStream } from 'fs';
import { randomUUID } from 'crypto';
import memoryManager, { MEMORY_LIMITS } from '../../utils/MemoryManager.js';
import { globalLogger as logger } from '../../utils/Logger.js';

const TEMP_DIR = path.join(os.tmpdir(), 'alya-downloads');
const REPLIT_CACHE_DIR = path.join(process.cwd(), '.cache');

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
} else {
    purgeAllTempFiles();
}

export function cleanupTempFiles() {
    try {
        if (fs.existsSync(TEMP_DIR)) {
            const files = fs.readdirSync(TEMP_DIR);
            const now = Date.now();
            const maxAge = 3 * 60 * 1000;
            for (const file of files) {
                const filePath = path.join(TEMP_DIR, file);
                try {
                    const stats = fs.statSync(filePath);
                    if (now - stats.mtimeMs > maxAge) {
                        fs.unlinkSync(filePath);
                    }
                } catch (e) {
                    try { fs.unlinkSync(filePath); } catch (_) { }
                }
            }
        }
        if (fs.existsSync(REPLIT_CACHE_DIR)) {
            const status = memoryManager.getMemoryStatus();
            if (status.isWarning || status.isCritical) {
                logger.warn('[SafeDownloader] Espacio bajo detectado - Limpiando .cache');
                const cacheFiles = fs.readdirSync(REPLIT_CACHE_DIR);
                for (const file of cacheFiles) {
                    if (file === 'replit' || file === 'toolchain.json') continue;
                    try {
                        const p = path.join(REPLIT_CACHE_DIR, file);
                        if (fs.statSync(p).isDirectory()) {
                            fs.rmSync(p, { recursive: true, force: true });
                        } else {
                            fs.unlinkSync(p);
                        }
                    } catch (_) { }
                }
            }
        }
    } catch (e: any) {
        logger.error('[SafeDownloader] Error limpiando archivos:', e.message);
    }
}

export function purgeAllTempFiles() {
    try {
        logger.warn('[SafeDownloader] ⚠️ PURGANDO TODOS LOS ARCHIVOS TEMPORALES');
        if (fs.existsSync(TEMP_DIR)) {
            const files = fs.readdirSync(TEMP_DIR);
            for (const file of files) {
                try {
                    fs.unlinkSync(path.join(TEMP_DIR, file));
                } catch (_) { }
            }
        }
    } catch (e: any) {
        logger.error('[SafeDownloader] Error en purga:', e.message);
    }
}

setInterval(cleanupTempFiles, 1 * 60 * 1000);

export async function getRemoteFileSize(url: string, timeout: number = 10000): Promise<number | null> {
    try {
        const response = await axios.head(url, {
            timeout,
            maxRedirects: 5,
            validateStatus: (status) => status < 400
        });
        const contentLength = response.headers['content-length'];
        return contentLength ? parseInt(contentLength, 10) : null;
    } catch (error) {
        try {
            const response = await axios.get(url, {
                timeout: 5000,
                headers: { 'Range': 'bytes=0-0' },
                maxRedirects: 5,
                validateStatus: (status) => status < 400
            });
            const contentRange = response.headers['content-range'];
            if (contentRange) {
                const match = contentRange.match(/\/(\d+)/);
                if (match) return parseInt(match[1], 10);
            }
        } catch (e) {}
        return null;
    }
}

export interface DownloadOptions {
    maxSize?: number;
    timeout?: number;
    returnBuffer?: boolean;
    headers?: any;
}

export async function safeDownload(url: string, options: DownloadOptions = {}): Promise<any> {
    const {
        maxSize = MEMORY_LIMITS.MAX_DOWNLOAD_SIZE,
        timeout = 60000,
        returnBuffer = false,
        headers = {}
    } = options;
    const downloadId = randomUUID();
    let tempFilePath: string | null = null;
    try {
        const canProcess = memoryManager.canProcessDownload(maxSize);
        if (!canProcess.allowed) {
            return {
                success: false,
                error: canProcess.message,
                reason: canProcess.reason
            };
        }
        const remoteSize = await getRemoteFileSize(url);
        if (remoteSize !== null) {
            if (remoteSize > maxSize) {
                return {
                    success: false,
                    error: `🛑 Archivo muy grande (${memoryManager.formatBytes(remoteSize)}). Máximo: ${memoryManager.formatBytes(maxSize)}`,
                    reason: 'FILE_TOO_LARGE',
                    actualSize: remoteSize
                };
            }
            const canProcessReal = memoryManager.canProcessDownload(remoteSize);
            if (!canProcessReal.allowed) {
                return {
                    success: false,
                    error: canProcessReal.message,
                    reason: canProcessReal.reason
                };
            }
        }
        memoryManager.registerBuffer(downloadId, remoteSize || maxSize, { url });
        tempFilePath = path.join(TEMP_DIR, `${downloadId}.tmp`);
        const response = await axios({
            method: 'GET',
            url,
            responseType: 'stream',
            timeout,
            headers,
            maxContentLength: maxSize,
            maxBodyLength: maxSize,
            onDownloadProgress: (progressEvent) => {
                if (progressEvent.loaded > maxSize) {
                    (response.data as any).destroy(new Error('FILE_TOO_LARGE'));
                }
            }
        });
        const contentLength = response.headers['content-length'];
        if (contentLength && parseInt(contentLength) > maxSize) {
            response.data.destroy();
            return {
                success: false,
                error: `🛑 Archivo muy grande. Máximo: ${memoryManager.formatBytes(maxSize)}`,
                reason: 'FILE_TOO_LARGE'
            };
        }
        let downloadedBytes = 0;
        const writeStream = createWriteStream(tempFilePath);
        await new Promise<void>((resolve, reject) => {
            response.data.on('data', (chunk: Buffer) => {
                downloadedBytes += chunk.length;
                if (downloadedBytes > maxSize) {
                    response.data.destroy();
                    writeStream.destroy();
                    reject(new Error('FILE_TOO_LARGE'));
                }
            });
            response.data.on('error', reject);
            writeStream.on('error', reject);
            writeStream.on('finish', resolve);
            response.data.pipe(writeStream);
        });
        memoryManager.stats.totalDownloads++;
        if (returnBuffer) {
            const buffer = fs.readFileSync(tempFilePath);
            try {
                fs.unlinkSync(tempFilePath);
            } catch (e) {}
            return {
                success: true,
                buffer,
                size: buffer.length,
                contentType: response.headers['content-type']
            };
        }
        return {
            success: true,
            filePath: tempFilePath,
            size: downloadedBytes,
            contentType: response.headers['content-type']
        };
    } catch (error: any) {
        memoryManager.stats.failedDownloads++;
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try {
                fs.unlinkSync(tempFilePath);
            } catch (e) {}
        }
        let errorMessage = '🛑 Error al descargar el archivo.';
        if (error.message === 'FILE_TOO_LARGE') {
            errorMessage = `🛑 El archivo es muy grande. Máximo: ${memoryManager.formatBytes(maxSize)}`;
        } else if (error.code === 'ENOSPC') {
            errorMessage = '🛑 No hay espacio suficiente. Intenta más tarde.';
            memoryManager.forceCleanup();
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            errorMessage = '🛑 Tiempo de espera agotado. Intenta de nuevo.';
        } else if (error.response?.status === 404) {
            errorMessage = '🛑 Archivo no encontrado.';
        }
        return {
            success: false,
            error: errorMessage,
            reason: error.code || error.message
        };
    } finally {
        memoryManager.releaseBuffer(downloadId);
    }
}

export async function downloadSmallFile(url: string, options: DownloadOptions = {}) {
    const maxSize = Math.min(options.maxSize || 5 * 1024 * 1024, MEMORY_LIMITS.MAX_BUFFER_SIZE);
    return safeDownload(url, {
        ...options,
        maxSize,
        returnBuffer: true
    });
}

export async function safeMediaDownload(url: string, options: DownloadOptions = {}) {
    const result = await safeDownload(url, {
        ...options,
        returnBuffer: false
    });
    if (!result.success) {
        return result;
    }
    return {
        success: true,
        filePath: result.filePath,
        size: result.size,
        contentType: result.contentType,
        cleanup: () => {
            if (result.filePath && fs.existsSync(result.filePath)) {
                try {
                    fs.unlinkSync(result.filePath);
                } catch (e) {}
            }
        }
    };
}

export async function checkDownloadSafe(url: string) {
    const size = await getRemoteFileSize(url);
    const canProcess = memoryManager.canProcessDownload(size || MEMORY_LIMITS.MAX_DOWNLOAD_SIZE);
    return {
        safe: canProcess.allowed,
        size,
        formattedSize: size ? memoryManager.formatBytes(size) : 'Desconocido',
        reason: canProcess.reason,
        message: canProcess.message
    };
}

export default {
    safeDownload,
    downloadSmallFile,
    safeMediaDownload,
    checkDownloadSafe,
    getRemoteFileSize,
    cleanupTempFiles,
    purgeAllTempFiles
};
