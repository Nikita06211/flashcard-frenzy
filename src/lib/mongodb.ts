import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;

let client: MongoClient;

export const getMongoClient = async () => {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client;
};