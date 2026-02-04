import { Client, Databases, Permission, Role } from 'node-appwrite';

const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID = '697cfdd300371de0272e';
const DATABASE_ID = '697cfe870008e83e4e81';
const COLLECTION_ID = 'friendships';

const API_KEY = process.env.APPWRITE_API_KEY;

if (!API_KEY) {
    console.error("❌ Erro: APPWRITE_API_KEY não encontrada.");
    console.error("  Windows: $env:APPWRITE_API_KEY='sua_ chave'; node scripts/fix_permissions.js");
    process.exit(1);
}

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function fixPermissions() {
    console.log(`🔌 Conectando ao Appwrite...`);

    try {
        console.log(`🔄 Buscando amizades...`);
        const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
        const docs = response.documents;
        console.log(`📄 Encontrados ${docs.length} registros.`);

        let updated = 0;

        for (const doc of docs) {
            const { requester_id, receiver_id } = doc;

            if (!requester_id || !receiver_id) {
                console.warn(`⚠️ Doc ${doc.$id} incompleto via ignorado.`);
                continue;
            }

            console.log(`🔧 Atualizando permissões: ${doc.$id} (${requester_id} <-> ${receiver_id})`);

            await databases.updateDocument(
                DATABASE_ID,
                COLLECTION_ID,
                doc.$id,
                {}, // Nenhuma alteração nos dados
                [
                    Permission.read(Role.user(requester_id)),
                    Permission.read(Role.user(receiver_id)),
                    Permission.update(Role.user(requester_id)),
                    Permission.update(Role.user(receiver_id)),
                    Permission.delete(Role.user(requester_id)),
                    Permission.delete(Role.user(receiver_id))
                ]
            );
            updated++;
        }

        console.log(`✅ Concluído! ${updated} registros atualizados.`);

    } catch (error) {
        console.error("❌ Erro:", error.message);
    }
}

fixPermissions();
