import crypto from 'crypto';

export interface PhonePePayload {
  merchantId: string;
  merchantTransactionId: string;
  merchantUserId: string;
  amount: number;
  redirectUrl: string;
  redirectMode: 'REDIRECT' | 'POST';
  callbackUrl: string;
  mobileNumber: string;
  paymentInstrument: {
    type: 'PAY_PAGE';
  };
}

export function getPhonePeConfig() {
  const merchantId = process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT';
  const saltKey = process.env.PHONEPE_SALT_KEY || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
  const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
  const environment = process.env.PHONEPE_ENV || 'SANDBOX';
  
  // Base URLs
  const baseUrl = environment === 'PRODUCTION' 
    ? 'https://api.phonepe.com/apis/hermes' 
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox';
    
  return {
    merchantId,
    saltKey,
    saltIndex,
    environment,
    baseUrl
  };
}

export function generatePhonePeHeaders(payload: object, apiEndpoint: string) {
  const { saltKey, saltIndex } = getPhonePeConfig();
  
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const stringToSign = base64Payload + apiEndpoint + saltKey;
  const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
  const xVerify = sha256 + '###' + saltIndex;
  
  return {
    base64Payload,
    xVerify
  };
}

export function verifyPhonePeCallbackSignature(responseBase64: string, xVerifyHeader: string): boolean {
  const { saltKey, saltIndex } = getPhonePeConfig();
  
  const stringToSign = responseBase64 + saltKey;
  const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
  const expectedXVerify = sha256 + '###' + saltIndex;
  
  return expectedXVerify === xVerifyHeader;
}
