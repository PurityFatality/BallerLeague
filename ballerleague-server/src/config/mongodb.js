import mongoose from 'mongoose';
import dns from 'node:dns';

function getDnsServersFromEnv() {
  const configured = process.env.MONGODB_DNS_SERVERS;
  if (!configured) {
    return ['8.8.8.8', '1.1.1.1'];
  }

  return configured
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);
}

function isSrvDnsRefused(error) {
  return error?.code === 'ECONNREFUSED' && error?.syscall === 'querySrv';
}

export async function connectMongo() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is required to start the server.');
  }

  try {
    await mongoose.connect(uri);
  } catch (error) {
    if (!isSrvDnsRefused(error)) {
      throw error;
    }

    dns.setServers(getDnsServersFromEnv());
    await mongoose.connect(uri);
  }

  console.log("Connected to mongodb");
}
