import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv(path) {
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
}

const env = loadEnv(resolve(process.cwd(), ".env.local"));
const key = env.GEMINI_API_KEY;
if (!key) {
  console.error("NO_KEY");
  process.exit(1);
}

const models = [
  env.GEMINI_MODEL,
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
].filter(Boolean);

const genAI = new GoogleGenerativeAI(key);

for (const modelName of models) {
  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
    });
    const result = await model.generateContent(
      'Ответь JSON: {"ok":true,"title":"тест"}'
    );
    const text = result.response.text();
    console.log("OK", modelName, text.slice(0, 120));
    process.exit(0);
  } catch (e) {
    console.log("FAIL", modelName, e?.status || "", String(e?.message || e).slice(0, 180));
  }
}

process.exit(2);
