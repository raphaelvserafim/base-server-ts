import fs, { existsSync, lstatSync, readdirSync, rmdirSync, unlinkSync } from "fs";
import * as crypto from 'crypto';
import mime from 'mime-types';

export const delay = (ms: number | undefined) => new Promise(resolve => setTimeout(resolve, ms));


export function validURL(str: string): boolean {
  var res = str.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
  return (res !== null);
}

export function regexVariables(text: string) {
  const regex = /{{(.*?)}}/g;
  const matches = [...text.matchAll(regex)].map((match) => match[1]);
  return matches;
}

export function estimateTypingTime(text: string, charsPerMinute: number = 700): { charCount: number; estimatedTimeMs: number } {
  const charCount = text.length;
  const estimatedTimeMs = (charCount / charsPerMinute) * 60 * 100;
  return {
    charCount,
    estimatedTimeMs: Math.round(estimatedTimeMs)
  };
}

export async function deleteFolderRecursive(path: fs.PathLike): Promise<void> {
  if (existsSync(path)) {
    readdirSync(path).forEach(function (file: any) {
      var curPath = path + "/" + file;
      if (lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        unlinkSync(curPath);
      }
    });
    rmdirSync(path);
  }
}

export function generateRandomToken(length: number): string {
  return crypto.randomBytes(length).toString('hex');
}


export function generateRandomNumbers(length: number) {
  const randomNumbers: number[] = [];
  for (let i = 0; i < length; i++) {
    const digit = Math.floor(Math.random() * 9) + 1;
    randomNumbers.push(digit);
  }
  const result = randomNumbers.join('');
  return result;
}


export function parseCurrency(value: any): number {
  const brazilianFormat = /^\d{1,3}(\.\d{3})*(,\d{2})?$/;
  const americanFormat = /^\d{1,3}(,\d{3})*(\.\d{2})?$/;

  if (brazilianFormat.test(value)) {
    return parseFloat(value.replace(/\./g, "").replace(",", "."));
  }

  if (americanFormat.test(value)) {
    return parseFloat(value.replace(/,/g, ""));
  }

  return 0;
}

export function formatCurrency(value: number, currency: "CAD" | "BRL" | "USD") {
  const locale = currency === "BRL" ? "pt-BR" : "en-US"
  const normalizedValue = (Number(value) / 100).toFixed(2);
  const fm = new Intl.NumberFormat(locale, {
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(normalizedValue));

  return fm;
}

export function extractNumbers(input: any) {
  return input?.replace(/\D/g, '');
}

export function isValidPhoneNumber(phoneNumber: string) {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
}


export function throwError(statusCode: number, message: string): never {
  const error = new Error(message);
  (error as any).statusCode = statusCode;
  throw error;
}



export function returnError(error: any) {

  if ((error as any).statusCode) {
    return { status: (error as any).statusCode, message: error.message };
  }
  return { status: 500, message: error.message };
}



export function getExtensionFromBase64(base64: string) {
  const matches = base64.match(/^data:(.*?);base64,/);
  if (!matches) return false;
  const mimeType = matches[1];
  return mime.extension(mimeType);
};

export function getFileExtension(mimeType: string): string | false {
  return mime.extension(mimeType) || false;
}


export function validCPF(cpf: string) {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
    return false;
  }
  let soma = 0;
  let resto;
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpf.charAt(i - 1)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) {
    return false;
  }
  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpf.charAt(i - 1)) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) {
    return false;
  }
  return true;
}