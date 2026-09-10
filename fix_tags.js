const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  try {
    const res = await client.query(`
      UPDATE courses
      SET careers = array_replace(careers, 'ingenieria_sistemas', 'sistemas')
      WHERE 'ingenieria_sistemas' = ANY(careers)
    `);
    console.log('✅ Updated ' + res.rowCount + ' courses to use sistemas instead of ingenieria_sistemas');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
run();
