import axios from 'axios';
import { randomUUID } from 'crypto';
import FormData from 'form-data';
import { globalLogger as logger } from '../../utils/Logger.js';

export class UploadService {
    static STORAGE_ZONE = 'olasoy';
    static ACCESS_KEY = 'd4dc5458-3015-4408-aff39f7a63bf-7977-4f9e';
    static STORAGE_URL = 'https://storage.bunnycdn.com';
    static CDN_URL = 'https://soblendz.b-cdn.net';
    static CATBOX_URL = 'https://catbox.moe/user/api.php';
    static CATBOX_USERHASH = '';
    static SOBLEND_R2_URL = 'https://soblend-r2.vercel.app/api/upload';
    static SOBLEND_R2_TOKEN = '35cdd57ea78cb99d837e87b6873127934230909d12941d8a69e4c134d760c90e';

    static async uploadToSoblendR2(buffer: Buffer, filename: string | null = null): Promise<string> {
        try {
            let ext = 'jpg';
            let mimeType = 'image/jpeg';
            try {
                const fileTypeModule = await import('file-type');
                const fileTypeFromBuffer = (fileTypeModule as any).fileTypeFromBuffer || (fileTypeModule as any).default?.fileTypeFromBuffer || (fileTypeModule as any).default;
                if (fileTypeFromBuffer && buffer) {
                    const type = await fileTypeFromBuffer(buffer);
                    if (type) {
                        ext = type.ext;
                        mimeType = type.mime;
                    }
                }
            } catch (e) {
                logger.warn('[UploadService] No se pudo detectar tipo de archivo, usando jpg por defecto');
            }
            if (!filename) {
                filename = `waifu_${Date.now()}.${ext}`;
            }
            logger.info(`[UploadService] Subiendo a Soblend R2: ${filename}`);
            const form = new FormData();
            form.append('image', buffer, {
                filename: filename,
                contentType: mimeType
            });
            const response = await axios.post(this.SOBLEND_R2_URL, form, {
                headers: {
                    ...form.getHeaders(),
                    'Authorization': `Bearer ${this.SOBLEND_R2_TOKEN}`
                },
                timeout: 60000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            if (response.data && response.data.success) {
                const publicUrl = response.data.data.publicUrl;
                logger.info(`[UploadService] Subida exitosa a Soblend R2: ${publicUrl}`);
                return publicUrl;
            } else {
                throw new Error(`Error en respuesta R2: ${JSON.stringify(response.data)}`);
            }
        } catch (error: any) {
            logger.error('[UploadService] Error en Soblend R2:', error.message);
            throw error;
        }
    }

    static async uploadToCatbox(buffer: Buffer, filename: string | null = null): Promise<string> {
        try {
            let ext = 'jpg';
            let mimeType = 'image/jpeg';
            try {
                const fileTypeModule = await import('file-type');
                const fileTypeFromBuffer = (fileTypeModule as any).fileTypeFromBuffer || (fileTypeModule as any).default?.fileTypeFromBuffer || (fileTypeModule as any).default;
                if (fileTypeFromBuffer && buffer) {
                    const type = await fileTypeFromBuffer(buffer);
                    if (type) {
                        ext = type.ext;
                        mimeType = type.mime;
                    }
                }
            } catch (e) {
                logger.warn('[UploadService] No se pudo detectar tipo de archivo, usando jpg por defecto');
            }
            if (!filename) {
                filename = `waifu_${Date.now()}.${ext}`;
            }
            logger.info(`[UploadService] Subiendo a CatBox: ${filename}`);
            const form = new FormData();
            form.append('reqtype', 'fileupload');
            form.append('fileToUpload', buffer, {
                filename: filename,
                contentType: mimeType
            });
            if (this.CATBOX_USERHASH) {
                form.append('userhash', this.CATBOX_USERHASH);
            }
            const response = await axios.post(this.CATBOX_URL, form, {
                headers: {
                    ...form.getHeaders()
                },
                timeout: 60000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            const imageUrl = typeof response.data === 'string' ? response.data.trim() : '';
            if (!imageUrl || !imageUrl.startsWith('http')) {
                throw new Error(`Respuesta inválida de CatBox: ${imageUrl}`);
            }
            logger.info(`[UploadService] Subida exitosa a CatBox: ${imageUrl}`);
            return imageUrl;
        } catch (error: any) {
            logger.error('[UploadService] Error en CatBox:', error.message);
            logger.info('[UploadService] Intentando respaldo con Bunny CDN...');
            try {
                return await this.uploadToBunny(buffer);
            } catch (bunnyError: any) {
                logger.error('[UploadService] Bunny CDN también falló:', bunnyError.message);
                throw new Error(`Falló CatBox y Bunny CDN: ${error.message}`);
            }
        }
    }

    static async uploadToBunny(buffer: Buffer): Promise<string> {
        try {
            let ext = 'jpg';
            try {
                const fileTypeModule = await import('file-type');
                const fileTypeFromBuffer = (fileTypeModule as any).fileTypeFromBuffer || (fileTypeModule as any).default?.fileTypeFromBuffer || (fileTypeModule as any).default;
                if (fileTypeFromBuffer && buffer) {
                    const type = await fileTypeFromBuffer(buffer);
                    if (type) ext = type.ext;
                }
            } catch (e) {
                logger.warn('[UploadService] No se pudo detectar tipo de archivo, usando jpg por defecto');
            }
            const filename = `waifus/${randomUUID()}.${ext}`;
            const uploadUrl = `${this.STORAGE_URL}/${this.STORAGE_ZONE}/${filename}`;
            logger.info(`[UploadService] Subiendo a Bunny CDN: ${filename}`);
            const response = await axios.put(uploadUrl, buffer, {
                headers: {
                    'AccessKey': this.ACCESS_KEY,
                    'Content-Type': 'application/octet-stream'
                },
                timeout: 60000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            if (response.status === 201 || response.status === 200) {
                const cdnUrl = `${this.CDN_URL}/${filename}`;
                logger.info(`[UploadService] Subida exitosa a Bunny CDN: ${cdnUrl}`);
                return cdnUrl;
            } else {
                throw new Error(`Error de Bunny CDN: ${response.status} - ${response.statusText}`);
            }
        } catch (error: any) {
            logger.error('[UploadService] Error en Bunny CDN:', error.message);
            throw error;
        }
    }

    static async uploadWithFallback(buffer: Buffer): Promise<string> {
        try {
            return await this.uploadToCatbox(buffer);
        } catch (error) {
            logger.warn('[UploadService] Usando Bunny CDN como respaldo definitivo');
            return await this.uploadToBunny(buffer);
        }
    }

    static async deleteFromCatbox(filename: string): Promise<boolean> {
        if (!this.CATBOX_USERHASH) {
            throw new Error('Se requiere CATBOX_USERHASH para eliminar archivos');
        }
        try {
            const form = new FormData();
            form.append('reqtype', 'deletefiles');
            form.append('userhash', this.CATBOX_USERHASH);
            form.append('files', filename);
            const response = await axios.post(this.CATBOX_URL, form, {
                headers: {
                    ...form.getHeaders()
                }
            });
            return typeof response.data === 'string' && response.data.trim() === 'Files successfully deleted.';
        } catch (error: any) {
            logger.error('[UploadService] Error eliminando de CatBox:', error.message);
            throw error;
        }
    }
}
