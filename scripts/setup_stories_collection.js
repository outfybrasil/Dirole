// Script para criar a collection "stories" no Appwrite
// Execute: node scripts/setup_stories_collection.js

const { Client, Databases, ID } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('679c1e3f0037e1d4c7f9') // Seu Project ID
    .setKey(process.env.APPWRITE_API_KEY); // Adicione sua API Key nas variáveis de ambiente

const databases = new Databases(client);
const DATABASE_ID = '679c1e8a0034f1e0a4c4';

async function createStoriesCollection() {
    try {
        console.log('Creating stories collection...');

        const collection = await databases.createCollection(
            DATABASE_ID,
            'stories',
            'stories'
        );

        console.log('✅ Collection created:', collection.$id);

        // Create attributes
        await databases.createStringAttribute(DATABASE_ID, 'stories', 'user_id', 255, true);
        await databases.createStringAttribute(DATABASE_ID, 'stories', 'user_name', 255, true);
        await databases.createStringAttribute(DATABASE_ID, 'stories', 'user_nickname', 255, false); // Optional
        await databases.createStringAttribute(DATABASE_ID, 'stories', 'user_avatar', 500, true);
        await databases.createStringAttribute(DATABASE_ID, 'stories', 'location_id', 255, true);
        await databases.createStringAttribute(DATABASE_ID, 'stories', 'location_name', 255, true);
        await databases.createStringAttribute(DATABASE_ID, 'stories', 'photo_url', 1000, true);
        await databases.createStringAttribute(DATABASE_ID, 'stories', 'created_at', 50, true);
        await databases.createStringAttribute(DATABASE_ID, 'stories', 'expires_at', 50, true);
        await databases.createStringAttribute(DATABASE_ID, 'stories', 'viewed_by', 10000, true);

        console.log('✅ Attributes created');

        // Create indexes
        await databases.createIndex(
            DATABASE_ID,
            'stories',
            'location_id_idx',
            'key',
            ['location_id']
        );

        await databases.createIndex(
            DATABASE_ID,
            'stories',
            'expires_at_idx',
            'key',
            ['expires_at']
        );

        console.log('✅ Indexes created');
        console.log('🎉 Stories collection setup complete!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createStoriesCollection();
