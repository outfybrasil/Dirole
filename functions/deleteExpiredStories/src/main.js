const sdk = require('node-appwrite');

/**
 * DIROLE - Delete Expired Stories Function
 * This function runs periodically (e.g., every hour) to delete stories older than 6 hours.
 */
module.exports = async (context) => {
    const client = new sdk.Client();
    const databases = new sdk.Databases(client);

    // 1. Try to use manual override env var
    // 2. Fallback to Appwrite provided env var
    // 3. Last resort: Hardcoded Cloud
    let endpoint = process.env.OVERRIDE_ENDPOINT;
    if (!endpoint) {
        endpoint = process.env.APPWRITE_FUNCTION_ENDPOINT;
    }
    if (!endpoint) {
        endpoint = 'https://cloud.appwrite.io/v1';
    }

    client.setEndpoint(endpoint);

    if (process.env.APPWRITE_FUNCTION_PROJECT_ID) {
        client.setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID);
    }
    if (process.env.APPWRITE_FUNCTION_API_KEY) {
        client.setKey(process.env.APPWRITE_FUNCTION_API_KEY);
    }

    context.log('--- DIROLE DEBUG V3 ---');
    context.log(`System Endpoint (env): ${process.env.APPWRITE_FUNCTION_ENDPOINT}`);
    context.log(`Override Endpoint (env): ${process.env.OVERRIDE_ENDPOINT}`);
    context.log(`FINAL USED ENDPOINT: ${endpoint}`);
    context.log(`Project ID: ${process.env.APPWRITE_FUNCTION_PROJECT_ID}`);
    // Do not log full API Key for security
    context.log(`API Key present: ${!!process.env.APPWRITE_FUNCTION_API_KEY} (Length: ${process.env.APPWRITE_FUNCTION_API_KEY ? process.env.APPWRITE_FUNCTION_API_KEY.length : 0})`);

    const databaseId = process.env.DATABASE_ID || '697cfe870008e83e4e81';
    const collectionId = 'stories';

    context.log(`DB Config - Database: ${databaseId}, Collection: ${collectionId}`);

    context.log('--- DELETE EXPIRED STORIES STARTED (VERSION 2) ---');
    context.log(`Current Endpoint config: ${client.config ? client.config.endpoint : 'unknown'}`);

    try {
        const now = new Date().toISOString();
        let totalDeleted = 0;
        while (true) {
            const queries = [
                sdk.Query.limit(100),
                sdk.Query.lessThan('expires_at', now)
            ];

            // Note: No cursor needed because we are deleting documents.
            // When page 1 is deleted, page 2 becomes page 1.

            const response = await databases.listDocuments(
                databaseId,
                collectionId,
                queries
            );

            if (response.documents.length === 0) {
                break;
            }

            // Process deletions in parallel for speed
            const deletePromises = response.documents.map(async (doc) => {
                try {
                    await databases.deleteDocument(databaseId, collectionId, doc.$id);
                    return true;
                } catch (delErr) {
                    context.error(`Failed to delete doc ${doc.$id}: ${delErr.message}`);
                    return false;
                }
            });

            const results = await Promise.all(deletePromises);
            const deletedCount = results.filter(r => r).length;
            totalDeleted += deletedCount;

            context.log(`Batch processed. Deleted: ${deletedCount}`);
        }

        context.log(`✅ Success: Deleted a total of ${totalDeleted} expired stories.`);

        return context.res.json({
            success: true,
            deleted: totalDeleted,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        context.error(`❌ Error during cleanup: ${err.message}`);
        return context.res.json({ success: false, error: err.message }, 500);
    }
};
