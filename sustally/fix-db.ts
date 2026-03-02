import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

async function fix() {
  await mongoose.connect(process.env.DATABASE_URL as string);
  console.log('Connected to DB');
  const db = mongoose.connection.db;
  if (!db) throw new Error("No db");

  const collections = await db.listCollections().toArray();
  const scope2ColName = collections.find(c => c.name.includes('scope2'))?.name || 'scope2applications';
  console.log('Using collection:', scope2ColName);
  const col = db.collection(scope2ColName);

  // Find broken records
  const docs = await col.find({}).toArray();
  let fixedCount = 0;
  for (const doc of docs) {
    let updateOpts: any = { $set: {} };
    let hasUpdate = false;

    // Some corrupted strings in object IDs might be present, so checking if they are strings and match .pdf or other files
    if (typeof doc.energySupportingEvidenceFile === 'string' && doc.energySupportingEvidenceFile.match(/\.(pdf|jpe?g|png)$/i)) {
      console.log('Found broken energyEvidenceFile in doc:', doc._id, doc.energySupportingEvidenceFile);
      hasUpdate = true;
      updateOpts.$unset = updateOpts.$unset || {};
      updateOpts.$unset.energySupportingEvidenceFile = "";
    }

    if (typeof doc.renewableSupportingEvidenceFile === 'string' && doc.renewableSupportingEvidenceFile.match(/\.(pdf|jpe?g|png)$/i)) {
      console.log('Found broken renewableEvidenceFile in doc:', doc._id, doc.renewableSupportingEvidenceFile);
      hasUpdate = true;
      updateOpts.$unset = updateOpts.$unset || {};
      updateOpts.$unset.renewableSupportingEvidenceFile = "";
    }

    if (hasUpdate) {
      if (Object.keys(updateOpts.$set).length === 0) delete updateOpts.$set;
      await col.updateOne({ _id: doc._id }, updateOpts);
      console.log('Fixed doc:', doc._id);
      fixedCount++;
    }
  }

  console.log('Fixed count:', fixedCount);
  process.exit(0);
}

fix().catch(console.error);
