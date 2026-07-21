/**
 * Arquivo de teste para o scraper Dattebayo BR
 * Execute em um ambiente Node.js
 */

// Simula o scraper para testes
const scraper = new DattebayoBRScraper();

// Testes básicos
async function runTests() {
  console.log("🧪 Iniciando testes do scraper Dattebayo BR...\n");

  try {
    // Teste 1: Busca
    console.log("📍 Teste 1: Busca por 'Naruto'");
    const searchResults = await scraper.search("Naruto");
    console.log(`✓ Encontrados ${searchResults.length} resultados`);
    if (searchResults.length > 0) {
      console.log(`  - Primeiro resultado: ${searchResults[0].title}`);
      console.log(`  - URL: ${searchResults[0].url}\n`);
    }

    // Teste 2: Obter episódios (se houver resultado)
    if (searchResults.length > 0) {
      console.log("📍 Teste 2: Obter episódios");
      const episodes = await scraper.getEpisodes(searchResults[0].id);
      console.log(`✓ Encontrados ${episodes.length} episódios`);
      if (episodes.length > 0) {
        console.log(`  - Primeiro episódio: ${episodes[0].title}`);
        console.log(`  - Número: ${episodes[0].number}\n`);

        // Teste 3: Obter streams (se houver episódio)
        console.log("📍 Teste 3: Obter streams");
        const streams = await scraper.getStreams(episodes[0].url);
        console.log(`✓ Encontrados ${streams.length} streams`);
        if (streams.length > 0) {
          streams.forEach((stream, idx) => {
            console.log(
              `  - Stream ${idx + 1}: ${stream.quality} (${stream.type})`,
            );
          });
        }
      }
    }

    console.log("\n✅ Testes completados com sucesso!");
  } catch (error) {
    console.error("❌ Erro durante os testes:", error);
  }
}

// Executa os testes se este arquivo for executado diretamente
if (require.main === module) {
  runTests();
}

module.exports = runTests;
