const sdk = require('node-appwrite');

/**
 * DIROLE - Monthly Ranking Reset Function
 * This function runs every 1st day of the month to reset points.
 */
module.exports = async (context) => {
    const client = new sdk.Client();
    const databases = new sdk.Databases(client);

    // Use environment variables provided by Appwrite
    client
        .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

    const databaseId = 'dirole_main';
    const collectionId = 'profiles';

    context.log('--- DIROLE SEASON RESET STARTED ---');

    try {
        let cursor = null;
        let totalUpdated = 0;
        let totalDeleted = 0;
        let processed = 0;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoffDate = thirtyDaysAgo.toISOString();

        context.log(`Cutoff date for cleanup: ${cutoffDate}`);

        // --- STEP 1: RESET USER POINTS ---
        context.log('Step 1: Resetting user points...');

        do {
            const queries = [sdk.Query.limit(50)];
            if (cursor) queries.push(sdk.Query.cursorAfter(cursor));

            const response = await databases.listDocuments(databaseId, collectionId, queries);

            for (const doc of response.documents) {
                processed++;
                // Reset points but keep XP/Level (lifetime progress)
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
        let inviteCursor = null;

        do {
            const queries = [
                sdk.Query.limit(100),
                sdk.Query.lessThan('$createdAt', cutoffDate)
            ];
            if (inviteCursor) queries.push(sdk.Query.cursorAfter(inviteCursor));

            const response = await databases.listDocuments(databaseId, 'invites', queries);

            for (const doc of response.documents) {
                await databases.deleteDocument(databaseId, 'invites', doc.$id);
                inviteDeleted++;
            }

            if (response.documents.length > 0) {
                inviteCursor = response.documents[response.documents.length - 1].$id;
            } else {
                inviteCursor = null;
            }
        } while (inviteCursor);

        context.log(`✅ Step 2 Success: Deleted ${inviteDeleted} old invites.`);

        // --- STEP 3: CLEANUP CLOSED REPORTS (>30 days) ---
        context.log('Step 3: Cleaning up old closed reports...');
        let reportsDeleted = 0;
        let reportCursor = null;

        do {
            const queries = [
                sdk.Query.limit(100),
                sdk.Query.equal('status', 'closed'),
                sdk.Query.lessThan('$createdAt', cutoffDate)
            ];
            if (reportCursor) queries.push(sdk.Query.cursorAfter(reportCursor));

            const response = await databases.listDocuments(databaseId, 'reports', queries);

            for (const doc of response.documents) {
                await databases.deleteDocument(databaseId, 'reports', doc.$id);
                reportsDeleted++;
            }

            if (response.documents.length > 0) {
                reportCursor = response.documents[response.documents.length - 1].$id;
            } else {
                reportCursor = null;
            }
        } while (reportCursor);

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
