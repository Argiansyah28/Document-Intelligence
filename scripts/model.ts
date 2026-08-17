import "dotenv/config";

type Model = { name: string; supportedGenerationMethods?: string[] };

async function main() {
  const kunci = process.env.GOOGLE_API_KEY;
  if (!kunci) throw new Error("GOOGLE_API_KEY belum diisi di file .env");

  const respons = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${kunci}`,
  );
  const data = await respons.json();
  if (!respons.ok) throw new Error(JSON.stringify(data.error));

  const dukung = (metode: string) =>
    (data.models as Model[])
      .filter((model) => model.supportedGenerationMethods?.includes(metode))
      .map((model) => `  ${model.name.replace("models/", "")}`)
      .join("\n");

  console.log(`Model jawaban:\n${dukung("generateContent")}`);
  console.log(`\nModel embedding:\n${dukung("embedContent")}`);
}

main().catch((galat) => {
  console.error(galat.message);
  process.exit(1);
});