import { env } from "@/config/env.config";
import { MongoClient } from "mongodb";
async function copyDatabase() {
  const client = new MongoClient(env.MONGODB_URI);

  if (process.versions.bun) {
    const dns = await import("node:dns");
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
  }

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const adminDb = client.db().admin();
    const { databases } = await adminDb.listDatabases();
    const dbNames = databases.map((db) => db.name);

    if (!dbNames.includes("LeaveMS-Live-v2")) {
      console.log("❌ Database LeaveMS-Live not found.");
      return;
    }

    console.log("📦 Found LeaveMS-Live. Copying data to LeaveMS...");

    const sourceDb = client.db("LeaveMS-Live-v2");
    const targetDb = client.db("LeaveMS-Stagging");

    const collections = await sourceDb.listCollections().toArray();

    for (const { name: collectionName } of collections) {
      const sourceCollection = sourceDb.collection(collectionName);
      const targetCollection = targetDb.collection(collectionName);

      // Drop the target collection to avoid _id conflicts
      await targetCollection.drop().catch(() => {});
      console.log(`🧹 Dropped target collection: ${collectionName}`);

      const documents = await sourceCollection.find().toArray();

      if (documents.length > 0) {
        const chunkSize = 1000;
        for (let i = 0; i < documents.length; i += chunkSize) {
          const chunk = documents.slice(i, i + chunkSize);
          await targetCollection.insertMany(chunk, { ordered: false });
        }

        console.log(
          `✅ Copied ${documents.length} documents into ${collectionName}`,
        );
      } else {
        console.log(`⚠️ No documents found in ${collectionName}`);
      }
    }

    console.log("🎉 Database copy completed successfully (IDs preserved).");
  } catch (error) {
    console.error("❌ Error copying database:", error);
  } finally {
    await client.close();
    console.log("🔒 MongoDB connection closed.");
  }
}

copyDatabase();

// // Mapping for renamed collections
// const COLLECTION_MAP: Record<string, string> = {
//   leavehistories: "leaves", // old → new
//   employeeleavebalances: "leavebalances", // old → new
//   tenants: "clients", // old → new
// };

// ========================================================================================================

// import { env } from "@/config/env.config";
// import { MongoClient, ObjectId } from "mongodb";

// // Recursively rename tenantId → clientId (but skip _id field and preserve MongoDB types)
// function renameTenantId(obj: any): any {
//   if (Array.isArray(obj)) {
//     return obj.map(renameTenantId);
//   } else if (obj && typeof obj === "object") {
//     // Preserve MongoDB special types (ObjectId, Date, etc.)
//     if (
//       obj instanceof ObjectId ||
//       obj instanceof Date ||
//       obj._bsontype || // Catches other BSON types
//       obj.constructor.name !== "Object" // Not a plain object
//     ) {
//       return obj; // Return as-is
//     }

//     const newObj: Record<string, any> = {};
//     for (const [key, value] of Object.entries(obj)) {
//       if (key === "_id") {
//         newObj[key] = value; // never modify _id
//         continue;
//       }
//       const newKey = key === "tenantId" ? "clientId" : key;
//       newObj[newKey] = renameTenantId(value);
//     }
//     return newObj;
//   }
//   return obj;
// }

// // Mapping for renamed collections
// const COLLECTION_MAP: Record<string, string> = {
//   leavehistories: "leaves", // old → new
//   employeeleavebalances: "leavebalances", // old → new
//   tenants: "clients", // old → new
// };

// async function copyDatabase() {
//   const client = new MongoClient(env.MONGODB_URI);

//   try {
//     await client.connect();
//     console.log("✅ Connected to MongoDB");

//     const adminDb = client.db().admin();
//     const { databases } = await adminDb.listDatabases();
//     const dbNames = databases.map((db) => db.name);

//     if (!dbNames.includes("LeaveMS-Live")) {
//       console.log("❌ Database LeaveMS-Live not found.");
//       return;
//     }

//     console.log("📦 Found LeaveMS-Live. Copying data to LeaveMS...");

//     const sourceDb = client.db("LeaveMS-Live");
//     const targetDb = client.db("LeaveMS");

//     const collections = await sourceDb.listCollections().toArray();

//     for (const { name: collectionName } of collections) {
//       const targetCollectionName =
//         COLLECTION_MAP[collectionName] || collectionName;

//       console.log({ targetCollectionName, collectionName });

//       const sourceCollection = sourceDb.collection(collectionName);
//       const targetCollection = targetDb.collection(targetCollectionName);

//       await targetCollection.drop().catch(() => {});
//       console.log(`🧹 Dropped target collection: ${targetCollectionName}`);

//       const documents = await sourceCollection.find().toArray();

//       if (documents.length > 0) {
//         const transformedDocs = documents.map((doc) => {
//           const cleanDoc = renameTenantId(doc);

//           // Fix invalid _id
//           if (
//             !cleanDoc._id ||
//             typeof cleanDoc._id !== "object" ||
//             Object.keys(cleanDoc._id).length === 0
//           ) {
//             cleanDoc._id = new ObjectId();
//           }

//           return cleanDoc;
//         });

//         const chunkSize = 1000;
//         let insertedCount = 0;

//         for (let i = 0; i < transformedDocs.length; i += chunkSize) {
//           const chunk = transformedDocs.slice(i, i + chunkSize);
//           try {
//             const result = await targetCollection.insertMany(chunk, {
//               ordered: false,
//             });
//             insertedCount += result.insertedCount;
//           } catch (err: any) {
//             if (err.code === 11000) {
//               console.warn(
//                 `⚠️ Duplicate _id detected in ${targetCollectionName}, skipping duplicates...`
//               );
//             } else {
//               throw err;
//             }
//           }
//         }

//         console.log(
//           `✅ Copied ${insertedCount} documents into ${targetCollectionName} (tenantId → clientId where applicable)`
//         );
//       } else {
//         console.log(`⚠️ No documents found in ${collectionName}`);
//       }
//     }

//     console.log("🎉 Database copy completed successfully.");
//   } catch (error) {
//     console.error("❌ Error copying database:", error);
//   } finally {
//     await client.close();
//     console.log("🔒 MongoDB connection closed.");
//   }
// }

// copyDatabase();

// ================================================================================

// import { env } from "@/config/env.config";
// import { MongoClient } from "mongodb";

// async function renameTenantIdToClientId() {
//   const client = new MongoClient(env.MONGODB_URI);

//   try {
//     await client.connect();
//     console.log("✅ Connected to MongoDB");

//     const db = client.db("LeaveMS");
//     const collections = await db.listCollections().toArray();

//     for (const { name: collectionName } of collections) {
//       console.log(`\n📝 Processing collection: ${collectionName}`);

//       const collection = db.collection(collectionName);

//       // Rename tenantId → clientId (keeps the same value)
//       const result = await collection.updateMany(
//         { tenantId: { $exists: true } },
//         {
//           $rename: { tenantId: "clientId" },
//         }
//       );

//       console.log(
//         `✅ Updated ${result.modifiedCount} documents in ${collectionName}`
//       );
//     }

//     console.log("\n🎉 All collections processed successfully.");
//   } catch (error) {
//     console.error("❌ Error:", error);
//   } finally {
//     await client.close();
//     console.log("🔒 MongoDB connection closed.");
//   }
// }

// renameTenantIdToClientId();
