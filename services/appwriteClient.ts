import { Client, Account, Databases, Storage } from 'appwrite';

const client = new Client();

// 💡 SUBSTITUA PELAS SUAS CHAVES DO APPWRITE CLOUD 💡
export const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID = '697cfdd300371de0272e';
export const APPWRITE_DATABASE_ID = '697cfe870008e83e4e81';
export const APPWRITE_BUCKET_ID = 'avatars';

client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export default client;
