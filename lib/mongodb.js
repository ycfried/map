import { MongoClient } from 'mongodb'

const uri = process.env.MONGO_URL

if (!uri) {
  throw new Error('Please add your MongoDB URI to .env.local as MONGO_URL')
}

let client
let clientPromise

if (process.env.NODE_ENV === 'development') {
  // In development, use a global variable
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri)
  clientPromise = client.connect()
}

export default clientPromise
