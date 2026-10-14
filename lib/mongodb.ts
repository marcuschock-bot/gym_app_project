import { MongoClient } from "mongodb";

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;

export const isMongoConfigured = Boolean(uri);

let clientPromise: Promise<MongoClient> | null = null;

if (uri) {
  if (!globalThis.mongoClientPromise) {
    const client = new MongoClient(uri);
    globalThis.mongoClientPromise = client.connect();
  }

  clientPromise = globalThis.mongoClientPromise;
}

export const getMongoClient = async (): Promise<MongoClient | null> => {
  if (!clientPromise) {
    return null;
  }

  return clientPromise;
};
