/**
 * Express Dispatch
 * PostgreSQL Database Connection
 */

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error(
        'DATABASE_URL is not configured. Add it to your .env file.'
    );
}

const pool = new Pool({
    connectionString,

    // PostgreSQL/Supabase hosted databases commonly require SSL.
    // Set DB_SSL=false for a local PostgreSQL server.
    ssl:
        process.env.DB_SSL === 'false'
            ? false
            : {
                  rejectUnauthorized: false
              },

    max: Number(process.env.DB_POOL_MAX || 10),

    idleTimeoutMillis: Number(
        process.env.DB_IDLE_TIMEOUT || 30000
    ),

    connectionTimeoutMillis: Number(
        process.env.DB_CONNECTION_TIMEOUT || 10000
    )
});

pool.on('error', (error) => {
    console.error(
        '[DATABASE] Unexpected PostgreSQL pool error:',
        error.message
    );
});

/**
 * Test the database connection.
 */
async function testDatabaseConnection() {
    const client = await pool.connect();

    try {
        const result = await client.query(
            'SELECT NOW() AS database_time'
        );

        console.log(
            '[DATABASE] PostgreSQL connected:',
            result.rows[0].database_time
        );

        return true;
    } finally {
        client.release();
    }
}

/**
 * Execute a parameterized SQL query.
 *
 * Example:
 * const result = await query(
 *     'SELECT * FROM shipments WHERE tracking_number = $1',
 *     [trackingNumber]
 * );
 */
async function query(text, params = []) {
    return pool.query(text, params);
}

/**
 * Gracefully close the database pool.
 */
async function closeDatabase() {
    await pool.end();
    console.log('[DATABASE] PostgreSQL pool closed.');
}

module.exports = {
    pool,
    query,
    testDatabaseConnection,
    closeDatabase
};