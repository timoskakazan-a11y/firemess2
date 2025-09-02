import { Injectable } from '@angular/core';

// This lets TypeScript know that CryptoJS is a global variable
// loaded from the script tag in index.html
declare var CryptoJS: any;

@Injectable({
  providedIn: 'root',
})
export class CryptoService {
  // IMPORTANT: In a real-world application, this key should be managed securely
  // and not hardcoded. For this example, we use a hardcoded key.
  private secretKey = 'FiremessSecretKey_2024!';

  encrypt(value: string): string {
    if (!value) return '';
    return CryptoJS.AES.encrypt(value, this.secretKey).toString();
  }

  decrypt(textToDecrypt: string): string {
    if (!textToDecrypt) return '';
    try {
        const bytes = CryptoJS.AES.decrypt(textToDecrypt, this.secretKey);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText;
    } catch(e) {
        console.error("Error decrypting data:", e);
        return ''; // Return empty string or handle error appropriately
    }
  }
}
