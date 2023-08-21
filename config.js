require('dotenv').config()

const PORT = process.env.PORT

const db = {
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD
}

module.exports = { db, PORT}