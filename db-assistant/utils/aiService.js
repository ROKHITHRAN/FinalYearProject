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
IMPORTANT: Table and column names are CASE SENSITIVE. 
You must use them EXACTLY as shown in the schema. Do not guess or modify.

Schema (copy exactly as provided):
${JSON.stringify(schema, null, 2)}

User request:
"${userQuery}"

The data must be like name with id and others not only id remember.
Output only the SQL query, no explanations, no extra formatting.
`;

  return await callGemini(prompt);
}

// Verify SQL
async function verifySQL(sql, schema) {
  const prompt = `
Schema (copy exactly as provided):
${JSON.stringify(schema, null, 2)}

Check if the following SQL query is valid. 
Consider case sensitivity.
If incorrect, fix it. Only return corrected SQL.
Please only give the sql query nothing other than that.
SQL:
${sql}
  `;

  return await callGemini(prompt);
}

async function getTableSummary(tables) {
  console.log(tables);

  const prompt = `
Tables present in the database:
${JSON.stringify(tables, null, 2)}

  Task:
  - Summarize about the database in plain language
  - Keep it short and easy for a non-technical user to understand.
  - Do not explain relationships or technical details.

  The output should give the user a clear idea of what kind of data is available
  so they can decide what to ask about.
  `;

  return await callGemini(prompt);
}

module.exports = { generateSQL, verifySQL, getTableSummary };
