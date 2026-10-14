import { MongoClient } from "mongodb";

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

const sanitizeUri = (value?: string): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("<") || trimmed.includes(">")) {
    return null;
  }

  return trimmed.startsWith("mongodb://") || trimmed.startsWith("mongodb+srv://") ? trimmed : null;
};

const uri = sanitizeUri(process.env.MONGODB_URI);

export const isMongoConfigured = Boolean(uri);

export const getMongoClient = async (): Promise<MongoClient | null> => {
  if (!uri) {
    return null;
  }

  if (!globalThis.mongoClientPromise) {
    const client = new MongoClient(uri);
    globalThis.mongoClientPromise = client.connect().catch((error) => {
      globalThis.mongoClientPromise = undefined;
      throw error;
    });
  }

  try {
    return await globalThis.mongoClientPromise;
  } catch {
    globalThis.mongoClientPromise = undefined;
    return null;
  }
};
