import CryptoJS from 'crypto-js';
import bcrypt from 'bcrypt';

export const hashPassword = async ({ password, salt = +process.env.salt }) => {
  const hash = await bcrypt.hash(password, salt);
  return hash;
};
export const comparePassword = async ( password, hash ) => {
  const result = await bcrypt.compare(password, hash);
  return result;
};

export const crypt_phone = ({
  phone,
  secret_key = process.env.secret_key,
}) => {
  return CryptoJS.AES.encrypt(phone, secret_key).toString();
};

export const decrypt_phone = ({
  phone,
  secret_key = process.env.secret_key,
}) => {
  const bytes = CryptoJS.AES.decrypt(phone, secret_key);
  return bytes.toString(CryptoJS.enc.Utf8);
};
