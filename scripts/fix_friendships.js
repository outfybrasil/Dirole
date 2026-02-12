
import { Client, Databases } from 'node-appwrite';

const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID = '697cfdd300371de0272e';
const DATABASE_ID = '697cfe870008e83e4e81';
const COLLECTION_ID = 'friendships';

const API_KEY = process.env.APPWRITE_API_KEY;

if (!API_KEY) {
    console.error("❌ Erro: APPWRITE_API_KEY não encontrada.");
    console.error("Por favor, rode o script definindo a chave de API:");
    console.error("  Windows (PowerShell): $env:APPWRITE_API_KEY='sua_chave_secreta'; node scripts/fix_friendships.js");
    console.error("  Linux/Mac: APPWRITE_API_KEY=sua_chave_secreta node scripts/fix_friendships.js");
    process.exit(1);
}

const client = new Client();
client
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function fixSchema() {
    console.log(`🔌 Conectando ao Appwrite [Project: ${PROJECT_ID}]...`);

    try {
        console.log(`🛠️ Verificando coleção '${COLLECTION_ID}'...`);

        // Tenta criar o atributo 'status'
        // createStringAttribute(databaseId, collectionId, key, size, required, default, array)
        await databases.createStringAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            'status',
            20,     // Size
            false,  // Required
            'pending' // Default value
        );

        console.log("✅ Sucesso! Atributo 'status' criado.");
        console.log("⚠️ Nota: O Appwrite pode levar alguns segundos para indexar o novo atributo.");

    } catch (error) {
        if (error.code === 409) {
            console.log("ℹ️ O atributo 'status' já existe.");
        } else {
            console.error("❌ Falha ao criar atributo:", error.message);
        }
    }
}

fixSchema();
