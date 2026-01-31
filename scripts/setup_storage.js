
import { Client, Storage, Permission, Role } from 'node-appwrite';

const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID = '697cfdd300371de0272e';
const BUCKET_ID = 'avatars'; // We'll try to find or update this bucket

const API_KEY = process.env.APPWRITE_API_KEY;

if (!API_KEY) {
    console.error("❌ Erro: APPWRITE_API_KEY não encontrada.");
    process.exit(1);
}

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const storage = new Storage(client);

async function setupStorage() {
    console.log(`🔌 Conectando ao Appwrite Storage [Bucket: ${BUCKET_ID}]...`);

    try {
        // Check buckets
        const buckets = await storage.listBuckets();
        console.log("📂 Buckets encontrados:", buckets.total);
        buckets.buckets.forEach(b => {
            console.log(` - [${b.$id}] ${b.name} (Enabled: ${b.enabled})`);
            // Update permissions for ANY existing bucket just in case
        });

        if (buckets.total > 0) {
            const targetBucket = buckets.buckets[0].$id;
            console.log(`🔄 Atualizando permissões do bucket: ${targetBucket}...`);

            await storage.updateBucket(
                targetBucket,
                buckets.buckets[0].name,
                [
                    Permission.read(Role.any()),
                    Permission.create(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users())
                ],
                false,
                true,
                undefined,
                ['jpg', 'png', 'gif', 'jpeg', 'webp']
            );
            console.log("✅ Permissões atualizadas com sucesso!");
        } else {
            console.log("⚠️ Nenhum bucket encontrado. Você precisa criar um manualmente no Console do Appwrite se o plano permite.");
        }

        // Atualiza permissões para garantir que é público
        console.log("🔄 Atualizando permissões do bucket...");
        await storage.updateBucket(
            BUCKET_ID,
            'Avatars',
            [
                Permission.read(Role.any()),    // QUALQUER UM pode ver (para carregar a img no app)
                Permission.create(Role.users()), // Usuários logados podem criar (upload)
                Permission.update(Role.users()), // Usuários podem atualizar
                Permission.delete(Role.users())  // Usuários podem deletar
            ],
            false, // File Security (se true, as permissoes do arquivo sobrescrevem. Se false, bucket manda)
            // Vamos deixar false para facilitar, ou true e setar permissão no arquivo.
            // MELHOR: Enabled=false significa Permissões do Bucket valem para todos os arquivos.
            // Vamos usar false (File Security Disabled) para que as regras do Bucket se apliquem a tudo.
            true, // Enabled (Ativado)
            undefined, // Max sizes
            ['jpg', 'png', 'gif', 'jpeg', 'webp'] // Allowed extensions
        );

        console.log("✅ Bucket 'avatars' configurado para LEITURA PÚBLICA.");

    } catch (error) {
        console.error("❌ Erro ao configurar storage:", error.message);
    }
}

setupStorage();
