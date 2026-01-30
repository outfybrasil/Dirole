/**
 * DIROLE - Appwrite Auto-Init Script
 * --------------------------------
 * Este script automatiza a criação do banco de dados, coleções e atributos no Appwrite Cloud.
 * 
 * Como usar:
 * 1. Instale o SDK de servidor: npm install node-appwrite
 * 2. Configure as variáveis de ambiente ou edite os valores abaixo.
 * 3. Execute: node scripts/appwrite_init.js
 */

import { Client, Databases, Storage, ID } from 'node-appwrite';
import fs from 'fs'; // Not strictly needed but good to have if we expand

// --- CONFIGURAÇÃO ---
const CONFIG = {
    endpoint: 'https://nyc.cloud.appwrite.io/v1',
    projectId: '697cfdd300371de0272e', // Seu Project ID
    apiKey: 'standard_701f4a2505b5d2cf78cdae39ca9947db6306e14ef421895dc22b9bb364c0a1374b64b7b54891e4ec47069f3174dd644d84fc25ec0f19821c9969f7fb7ee2e40aab6685155cf57637d4ec0df4bd03100c4fec60843770490c29ad1bdb57c53cf320ab8f3e976b19f6d669f9e76b724e0cc25fcfa0583bd045e2368a9e6f762275',       // Crie uma API Key no Console (com escopos de databases.write, collections.write, attributes.write)
    databaseId: '697cfe870008e83e4e81',        // ID do Banco
    databaseName: 'Dirole'
};

const client = new Client()
    .setEndpoint(CONFIG.endpoint)
    .setProject(CONFIG.projectId)
    .setKey(CONFIG.apiKey);

const databases = new Databases(client);
const storage = new Storage(client);

// --- DEFINIÇÃO DO SCHEMA ---
const COLLECTIONS = [
    {
        id: 'profiles',
        name: 'Perfis de Usuário',
        attributes: [
            { key: 'userId', type: 'string', size: 255, required: true },
            { key: 'name', type: 'string', size: 255, required: true },
            { key: 'nickname', type: 'string', size: 255, required: false },
            { key: 'email', type: 'string', size: 255, required: false },
            { key: 'avatar', type: 'string', size: 255, required: false, default: '😎' },
            { key: 'points', type: 'integer', required: false, default: 0 },
            { key: 'xp', type: 'integer', required: false, default: 0 },
            { key: 'level', type: 'integer', required: false, default: 1 },
            { key: 'gender', type: 'string', size: 50, required: false, default: 'Outro' },
            { key: 'badges', type: 'string', size: 2000, required: false, default: '[]' },
            { key: 'favorites', type: 'string', size: 2000, required: false, default: '[]' }
        ],
        indexes: [
            { key: 'idx_userId', type: 'unique', attributes: ['userId'] }
        ]
    },
    {
        id: 'locations',
        name: 'Locais/Roles',
        attributes: [
            { key: 'name', type: 'string', size: 255, required: true },
            { key: 'address', type: 'string', size: 500, required: false },
            { key: 'type', type: 'string', size: 100, required: true },
            { key: 'lat', type: 'float', required: true },
            { key: 'lng', type: 'float', required: true },
            { key: 'image_url', type: 'string', size: 500, required: false },
            { key: 'verified', type: 'boolean', required: false, default: false },
            { key: 'votes_for_verification', type: 'integer', required: false, default: 0 },
            { key: 'is_official', type: 'boolean', required: false, default: false },
            { key: 'owner_id', type: 'string', size: 255, required: false },
            { key: 'official_description', type: 'string', size: 1000, required: false },
            { key: 'instagram', type: 'string', size: 255, required: false },
            { key: 'whatsapp', type: 'string', size: 255, required: false },
            { key: 'stats', type: 'string', size: 2000, required: false, default: '{}' }
        ]
    },
    {
        id: 'reviews',
        name: 'Avaliações',
        attributes: [
            { key: 'locationId', type: 'string', size: 255, required: true },
            { key: 'userId', type: 'string', size: 255, required: true },
            { key: 'userName', type: 'string', size: 255, required: false },
            { key: 'userAvatar', type: 'string', size: 255, required: false },
            { key: 'price', type: 'integer', required: false, default: 0 },
            { key: 'crowd', type: 'integer', required: false, default: 0 },
            { key: 'vibe', type: 'integer', required: false, default: 0 },
            { key: 'gender', type: 'integer', required: false, default: 0 },
            { key: 'comment', type: 'string', size: 1000, required: false }
        ]
    },
    {
        id: 'friendships',
        name: 'Relacionamentos/Amigos',
        attributes: [
            { key: 'requester_id', type: 'string', size: 255, required: true },
            { key: 'receiver_id', type: 'string', size: 255, required: true },
            { key: 'status', type: 'string', size: 50, required: true, default: 'pending' }
        ]
    },
    {
        id: 'invites',
        name: 'Convites para Rolê',
        attributes: [
            { key: 'from_user_id', type: 'string', size: 255, required: true },
            { key: 'to_user_id', type: 'string', size: 255, required: true },
            { key: 'location_id', type: 'string', size: 255, required: true },
            { key: 'location_name', type: 'string', size: 255, required: true },
            { key: 'message', type: 'string', size: 500, required: false, default: 'Bora?' },
            { key: 'status', type: 'string', size: 50, required: false, default: 'pending' }
        ]
    },
    {
        id: 'reports',
        name: 'Denúncias',
        attributes: [
            { key: 'targetId', type: 'string', size: 255, required: true },
            { key: 'targetType', type: 'string', size: 50, required: true },
            { key: 'reporterId', type: 'string', size: 255, required: true },
            { key: 'reason', type: 'string', size: 500, required: true },
            { key: 'status', type: 'string', size: 50, required: false, default: 'open' }
        ]
    }
];

// --- CORE FUNCTIONS ---

async function setup() {
    console.log("🚀 Iniciando Setup do Appwrite...");

    try {
        // 1. Criar Banco
        try {
            await databases.create(CONFIG.databaseId, CONFIG.databaseName);
            console.log(`✅ Banco de Dados '${CONFIG.databaseName}' criado.`);
        } catch (e) {
            console.log(`ℹ️ Banco de Dados já existe ou erro: ${e.message}`);
        }

        // 2. Criar Coleções e Atributos
        for (const col of COLLECTIONS) {
            console.log(`\n--- Configurando Coleção: ${col.id} ---`);

            try {
                await databases.createCollection(CONFIG.databaseId, col.id, col.name, ["read(\"any\")", "create(\"any\")", "update(\"any\")"]);
                console.log(`✅ Coleção '${col.id}' criada.`);
            } catch (e) {
                console.log(`ℹ️ Coleção '${col.id}' info: ${e.message}`);
            }

            // Atributos
            for (const attr of col.attributes) {
                try {
                    if (attr.type === 'string') {
                        await databases.createStringAttribute(CONFIG.databaseId, col.id, attr.key, attr.size, attr.required, attr.default);
                    } else if (attr.type === 'integer') {
                        await databases.createIntegerAttribute(CONFIG.databaseId, col.id, attr.key, attr.required, 0, 1000000, attr.default);
                    } else if (attr.type === 'float') {
                        await databases.createFloatAttribute(CONFIG.databaseId, col.id, attr.key, attr.required, -90, 180, attr.default);
                    } else if (attr.type === 'boolean') {
                        await databases.createBooleanAttribute(CONFIG.databaseId, col.id, attr.key, attr.required, attr.default);
                    }
                    console.log(`  - Atributo '${attr.key}' ok.`);
                } catch (e) {
                    console.log(`  - Atributo '${attr.key}' info: ${e.message}`);
                }
            }

            // Índices
            if (col.indexes) {
                for (const idx of col.indexes) {
                    try {
                        await databases.createIndex(CONFIG.databaseId, col.id, idx.key, idx.type, idx.attributes);
                        console.log(`  - Índice '${idx.key}' criado.`);
                    } catch (e) {
                        console.log(`  - Índice '${idx.key}' já existe.`);
                    }
                }
            }
        }

        // 3. Criar Bucket de Armazenamento
        console.log(`\n--- Configurando Storage (Bucket) ---`);
        try {
            await storage.createBucket(CONFIG.databaseId === 'avatars' ? ID.unique() : 'avatars', 'Avatares', ["read(\"any\")", "create(\"any\")", "update(\"any\")"]);
            console.log(`✅ Bucket 'avatars' criado.`);
        } catch (e) {
            console.log(`ℹ️ Bucket 'avatars' info: ${e.message}`);
        }

        console.log("\n✨ Setup finalizado com sucesso!");
        console.log("👉 Lembre-se de configurar as permissões de Bucket e API Keys se necessário.");

    } catch (error) {
        console.error("\n❌ Erro fatal no setup:", error.message);
    }
}

setup();
