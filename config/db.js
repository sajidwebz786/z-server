const { Sequelize, QueryTypes } = require('sequelize');
require('dotenv').config();

const logging = process.env.DB_LOGGING === 'true' ? console.log : false;

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging,
      dialectOptions: process.env.NODE_ENV === 'production'
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
    })
  : new Sequelize(
      process.env.DB_NAME || 'zulanexdb',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'niavoit',
      {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        dialect: 'postgres',
        logging,
      }
    );

function inferQueryType(sql) {
  const verb = sql.trim().split(/\s+/)[0].toUpperCase();
  if (verb === 'SELECT') return QueryTypes.SELECT;
  return QueryTypes.RAW;
}

async function query(sql, params = []) {
  const type = inferQueryType(sql);
  const result = await sequelize.query(sql, { bind: params, type });

  if (type === QueryTypes.SELECT) return { rows: result };
  if (Array.isArray(result)) {
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return { rows };
  }
  return { rows: [] };
}

async function connect() {
  await sequelize.authenticate();
  return {
    query,
    release() {},
  };
}

function on() {
  // Compatibility no-op for the old pg Pool API.
}

module.exports = {
  sequelize,
  query,
  connect,
  on,
};
