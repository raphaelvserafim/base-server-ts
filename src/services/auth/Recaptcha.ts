import axios from 'axios';
import { config } from '@app/config/index.js';
import { throwError } from '@app/utils/index.js';

export class RecaptchaValidator {

  static async verify(token: string, expectedAction: string = 'submit') {
    try {
      const secretKey = config.recaptcha.secretKey;
      const response = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {
            secret: secretKey,
            response: token
          },
          timeout: 10000 // 10 segundos
        }
      );

      console.log('✅ reCAPTCHA Response:', JSON.stringify(response.data, null, 2));

      const { success, score, action, 'error-codes': errorCodes, challenge_ts, hostname } = response.data;

      if (!success) {
        console.error('❌ reCAPTCHA falhou:', {
          errorCodes,
          hostname,
          challenge_ts
        });

        if (errorCodes?.includes('timeout-or-duplicate')) {
          throwError(400, 'Token do reCAPTCHA expirado ou já utilizado. Recarregue a página.');
        }
        if (errorCodes?.includes('invalid-input-response')) {
          throwError(400, 'Token do reCAPTCHA inválido. Verifique as chaves de API.');
        }
        if (errorCodes?.includes('invalid-input-secret')) {
          throwError(500, 'Configuração incorreta do reCAPTCHA no servidor.');
        }
        if (errorCodes?.includes('missing-input-response')) {
          throwError(400, 'Token do reCAPTCHA não foi enviado.');
        }

        throwError(400, `Falha na verificação do reCAPTCHA: ${errorCodes?.join(', ')}`);
      }

      console.log('📊 Score:', score);
      console.log('🎬 Action:', action);
      console.log('🌐 Hostname:', hostname);

      // Para reCAPTCHA v3, verificar o score
      if (score !== undefined) {
        if (score < 0.5) {
          console.warn('⚠️ Score baixo:', score);
          throwError(400, 'Verificação de segurança falhou. Tente novamente.');
        }
      }

      // Verificar se a action corresponde
      if (action && expectedAction && action !== expectedAction) {
        console.warn(`⚠️ Action mismatch: expected "${expectedAction}", got "${action}"`);
      }

      return {
        success: true,
        score: score || null,
        action: action || null,
        hostname: hostname || null
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('🔥 Erro Axios:', error.response?.data || error.message);
      } else {
        console.error('🔥 Erro desconhecido:', error);
      }

      if (error instanceof Error && error.message.includes('reCAPTCHA')) {
        throw error;
      }

      throwError(500, 'Erro ao verificar reCAPTCHA');
    }
  }
}