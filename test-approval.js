const { Pool } = require('pg');
const pool = new Pool({
  host: 'dpg-d4mpccpr0fns73ad6uv0-a.singapore-postgres.render.com',
  port: 5432,
  user: 'omias_user',
  password: 'IxP0kZC2hXBNfDISoTx8BdtcWW2ci1sj',
  database: 'omias',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    // Get a pending request
    const pendingResult = await pool.query(`
      SELECT * FROM enrollment_requests WHERE status = 'pending' LIMIT 1
    `);
    
    if (pendingResult.rows.length === 0) {
      console.log('No pending requests found');
      await pool.end();
      return;
    }

    const request = pendingResult.rows[0];
    console.log('Testing approval for request:', request.id);

    // Try to insert into early_registration (what approve-request does)
    const currentAddress = (request.current_address && String(request.current_address).trim()) || 'N/A';
    const ipCommunity = (request.ip_community && String(request.ip_community).trim()) || 'No';
    const ipCommunitySpecify = ipCommunity === 'Yes' ? (request.ip_community_specify || null) : null;
    const pwd = (request.pwd && String(request.pwd).trim()) || 'No';
    const pwdSpecify = pwd === 'Yes' ? (request.pwd_specify || null) : null;

    console.log('Values to insert:');
    console.log({
      gmail_address: request.gmail_address,
      school_year: request.school_year,
      lrn: request.lrn,
      grade_level: request.grade_level,
      last_name: request.last_name,
      first_name: request.first_name,
      middle_name: request.middle_name,
      ext_name: request.ext_name,
      birthday: request.birthday,
      age: request.age,
      sex: request.sex,
      religion: request.religion,
      current_address: currentAddress,
      ip_community: ipCommunity,
      pwd: pwd,
      registration_date: request.registration_date,
      printed_name: request.printed_name,
      signature_image_path: request.signature_image_path
    });

    const insertQuery = `
      INSERT INTO early_registration (
        gmail_address, school_year, lrn, grade_level,
        last_name, first_name, middle_name, ext_name,
        birthday, age, sex, religion, current_address,
        ip_community, ip_community_specify, pwd, pwd_specify,
        father_name, mother_name, guardian_name, contact_number,
        registration_date, printed_name, signature_image_path
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING id
    `;

    const insertValues = [
      request.gmail_address,
      request.school_year,
      request.lrn || null,
      request.grade_level,
      request.last_name,
      request.first_name,
      request.middle_name || null,
      request.ext_name || null,
      request.birthday,
      request.age,
      request.sex,
      request.religion || null,
      currentAddress,
      ipCommunity,
      ipCommunitySpecify,
      pwd,
      pwdSpecify,
      request.father_name || null,
      request.mother_name || null,
      request.guardian_name || null,
      request.contact_number || null,
      request.registration_date,
      request.printed_name,
      request.signature_image_path || null
    ];

    const result = await pool.query(insertQuery, insertValues);
    console.log('✅ Insert successful:', result.rows[0]);
    
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Full error:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint
    });
    await pool.end();
  }
})();
