const sdk = require('node-appwrite');

/**
 * DIROLE - Monthly Ranking Reset Function
 * This function runs every 1st day of the month to reset points.
 */
module.exports = async (context) => {
    const client = new sdk.Client();
    const databases = new sdk.Databases(client);

    // 1. Endpoint Setup with Override Support
    let endpoint = process.env.OVERRIDE_ENDPOINT;
    if (!endpoint) endpoint = process.env.APPWRITE_FUNCTION_ENDPOINT;
    if (!endpoint) endpoint = 'https://cloud.appwrite.io/v1';

    client.setEndpoint(endpoint);

    if (process.env.APPWRITE_FUNCTION_PROJECT_ID) {
        client.setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID);
    }
    if (process.env.APPWRITE_FUNCTION_API_KEY) {
        client.setKey(process.env.APPWRITE_FUNCTION_API_KEY);
    }

    const databaseId = process.env.DATABASE_ID || '697cfe870008e83e4e81';
    const collectionId = 'profiles';

    context.log('--- DIROLE SEASON RESET STARTED ---');
    context.log(`Endpoint: ${endpoint}`);
    context.log(`Database ID: ${databaseId}`);

    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoffDate = thirtyDaysAgo.toISOString();

        context.log(`Cutoff date for cleanup: ${cutoffDate}`);

        // --- STEP 1: RESET USER POINTS ---
        context.log('Step 1: Resetting user points...');
        let cursor = null;
        let totalUpdated = 0;
        let processed = 0;

        do {
            const queries = [sdk.Query.limit(50)];
            if (cursor) queries.push(sdk.Query.cursorAfter(cursor));

            const response = await databases.listDocuments(databaseId, collectionId, queries);

            for (const doc of response.documents) {
                processed++;
                if (doc.points !== 0) {
                    await databases.updateDocument(databaseId, collectionId, doc.$id, {
                        points: 0
                    });
                    totalUpdated++;
                }
            }

            if (response.documents.length > 0) {
                cursor = response.documents[response.documents.length - 1].$id;
            } else {
                cursor = null;
            }
        } while (cursor);

        context.log(`✅ Step 1 Success: Processed ${processed} users. Reset ${totalUpdated} rankings.`);

        // --- STEP 2: CLEANUP OLD INVITES (>30 days) ---
        context.log('Step 2: Cleaning up old invites...');
        let inviteDeleted = 0;

        while (true) {
            const queries = [
                sdk.Query.limit(100),
                sdk.Query.lessThan('$createdAt', cutoffDate)
            ];

            const response = await databases.listDocuments(databaseId, 'invites', queries);

            if (response.documents.length === 0) break;

            const deletePromises = response.documents.map(async (doc) => {
                try {
                    await databases.deleteDocument(databaseId, 'invites', doc.$id);
                    return true;
                } catch (e) {
                    return false;
                }
            });

            const results = await Promise.all(deletePromises);
            inviteDeleted += results.filter(r => r).length;
            context.log(`Step 2 Batch: Deleted ${results.length} invites`);
        }

        context.log(`✅ Step 2 Success: Deleted ${inviteDeleted} old invites.`);

        // --- STEP 3: CLEANUP CLOSED REPORTS (>30 days) ---
        context.log('Step 3: Cleaning up old closed reports...');
        let reportsDeleted = 0;

        while (true) {
            const queries = [
                sdk.Query.limit(100),
                sdk.Query.equal('status', 'closed'),
                sdk.Query.lessThan('$createdAt', cutoffDate)
            ];

            const response = await databases.listDocuments(databaseId, 'reports', queries);

            if (response.documents.length === 0) break;

            const deletePromises = response.documents.map(async (doc) => {
                try {
                    await databases.deleteDocument(databaseId, 'reports', doc.$id);
                    return true;
                } catch (e) {
                    return false;
                }
            });

            const results = await Promise.all(deletePromises);
            reportsDeleted += results.filter(r => r).length;
            context.log(`Step 3 Batch: Deleted ${results.length} reports`);
        }

        context.log(`✅ Step 3 Success: Deleted ${reportsDeleted} closed reports.`);

        return context.res.json({
            success: true,
            usersProcessed: processed,
            rankingsReset: totalUpdated,
            invitesDeleted: inviteDeleted,
            reportsDeleted: reportsDeleted,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        context.error(`❌ Error during reset: ${err.message}`);
        return context.res.json({ success: false, error: err.message }, 500);
    }
};
