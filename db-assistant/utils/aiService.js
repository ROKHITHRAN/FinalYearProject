const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // keep it in .env
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
  GEMINI_API_KEY;

// Helper to call Gemini
async function callGemini(prompt) {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.statusText}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// Generate SQL
async function generateSQL(userQuery, schema) {
  const prompt = `
You are an expert SQL assistant. 
remember the table names are case sensitive ${schema.tables}
Given this database schema:

${schema}
read the schema carefully and use the name of column and table correctly
Convert the following natural language request into a valid SQL query:
"${userQuery}"

Only output the SQL, no explanation.
  `;

  return await callGemini(prompt);
}

// Verify SQL
async function verifySQL(sql, schema) {
  const prompt = `
Given this schema:

${schema}

Check if the following SQL query is valid. 
Consider case sensitivity.
If incorrect, fix it. Only return corrected SQL.
Please only give the sql query nothing other than that.
SQL:
${sql}
  `;

  return await callGemini(prompt);
}

module.exports = { generateSQL, verifySQL };
