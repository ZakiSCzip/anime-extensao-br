/**
 * NuvioTV Scraper Plugin - Dattebayo BR
 * Adaptado de anime-extensao-br para NuvioTV
 */

class DattebayoBRScraper {
  constructor() {
    this.baseUrl = "https://www.dattebayo-br.com";
    this.userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
  }

  /**
   * Busca anime por título
   */
  async search(query) {
    if (!query || query.trim() === "") return [];

    const limitedQuery = this.limitTitleToThreeWords(query.trim());
    const url = `${this.baseUrl}/busca?busca=${encodeURIComponent(limitedQuery)}&page=1`;

    try {
      const response = await fetch(url, {
        headers: this.requestHeaders(),
      });

      if (!response.ok) return [];

      const html = await response.text();
      const results = this.parseSearchResults(html);
      return results;
    } catch (error) {
      console.error("Erro na busca:", error);
      return [];
    }
  }

  /**
   * Obtém lista de episódios de um anime
   */
  async getEpisodes(animeId) {
    if (!animeId) return [];

    const episodes = [];
    const seen = new Set();
    const cleanId = animeId.replace(/^\//, "").replace(/\/page\/\d+$/, "");
    const basePath = `${this.baseUrl}/${cleanId}`;

    try {
      for (let page = 1; page <= 30; page++) {
        const pageUrl = page === 1 ? basePath : `${basePath}/page/${page}`;

        try {
          const response = await fetch(pageUrl, {
            headers: this.requestHeaders(),
          });

          if (!response.ok) break;

          const html = await response.text();
          const pageEpisodes = this.parseEpisodes(html, seen);

          if (pageEpisodes.length === 0) break;

          episodes.push(...pageEpisodes);
        } catch (error) {
          console.error(`Erro ao buscar página ${page}:`, error);
          break;
        }
      }
    } catch (error) {
      console.error("Erro ao buscar episódios:", error);
    }

    // Ordena por número do episódio
    episodes.sort((a, b) => a.number - b.number);
    return episodes;
  }

  /**
   * Obtém os links de stream de um episódio
   */
  async getStreams(episodeUrl) {
    if (!episodeUrl) return [];

    try {
      const response = await fetch(episodeUrl, {
        headers: this.requestHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          `Erro ao buscar página do episódio: ${response.status}`,
        );
      }

      const html = await response.text();
      const streams = this.parseStreams(html, episodeUrl);
      return streams;
    } catch (error) {
      console.error("Erro ao buscar streams:", error);
      return [];
    }
  }

  /**
   * ============= MÉTODOS PRIVADOS =============
   */

  parseSearchResults(html) {
    const results = [];
    // Simples regex para extrair resultados (adaptado para parse básico sem DOM)
    const itemRegex =
      /ultimosAnimesHomeItem[\s\S]*?href="([^"]*)"[\s\S]*?ultimosAnimesHomeItemInfosNome">([^<]+)/g;
    let match;

    while ((match = itemRegex.exec(html)) !== null) {
      const href = match[1] || "";
      const title = match[2]?.trim() || "Sem título";
      const path = this.extractPath(href);

      if (path) {
        results.push({
          id: path,
          title: this.limitTitleToThreeWords(title),
          url: `${this.baseUrl}/${path}`,
          type: "series",
        });
      }
    }

    return results;
  }

  parseEpisodes(html, seen) {
    const episodes = [];
    const itemRegex =
      /ultimosEpisodiosHomeItem[\s\S]*?href="([^"]*)"[\s\S]*?ultimosEpisodiosHomeItemInfosNum">([^<]+)[\s\S]*?ultimosEpisodiosHomeItemInfosNome">([^<]*)/g;
    let match;

    while ((match = itemRegex.exec(html)) !== null) {
      const href = match[1] || "";

      if (!href || seen.has(href)) continue;
      seen.add(href);

      const rawNum = match[2]?.replace(/Episódio/gi, "").trim() || "0";
      const number = parseFloat(rawNum.replace(",", "."));

      if (isNaN(number)) continue;

      const name = match[3]?.trim() || `Episódio ${rawNum}`;
      const epUrl = href.startsWith("http") ? href : `${this.baseUrl}${href}`;

      episodes.push({
        id: href.replace(/^\//, ""),
        number: number,
        title: name,
        url: epUrl,
      });
    }

    return episodes;
  }

  parseStreams(html, episodeUrl) {
    const streams = [];
    const tabRegex =
      /AbasBox[\s\S]*?<div class="Aba" aba-type="([^"]+)">([^<]+)/g;
    let match;

    const qualityNames = {
      FULLHD: "1080p",
      "FULL HD": "1080p",
      1080: "1080p",
      720: "720p",
      480: "480p",
      360: "360p",
    };

    while ((match = tabRegex.exec(html)) !== null) {
      const abaType = match[1];
      const tabName = (match[2] || "").toUpperCase();

      // Verifica se é uma qualidade válida
      let quality = null;
      for (const [key, value] of Object.entries(qualityNames)) {
        if (tabName.includes(key)) {
          quality = value;
          break;
        }
      }

      if (!quality) continue;

      // Extrai URL do container correspondente
      const containerRegex = new RegExp(
        `id="${abaType}"[\\s\\S]*?var vid\\s*=\\s*['"](.*?)['"]`,
        "i",
      );
      const urlMatch = containerRegex.exec(html);

      if (urlMatch && urlMatch[1]) {
        let url = urlMatch[1];
        if (url.startsWith("//")) {
          url = "https:" + url;
        }

        streams.push({
          url: url,
          quality: quality,
          type: url.endsWith(".m3u8") ? "hls" : "http",
          referer: episodeUrl,
        });
      }
    }

    return streams;
  }

  limitTitleToThreeWords(title) {
    const words = title.trim().split(/\s+/);
    return words.slice(0, 3).join(" ");
  }

  extractPath(href) {
    if (!href) return "";

    if (href.startsWith("http")) {
      try {
        return new URL(href).pathname.replace(/^\//, "");
      } catch {
        return "";
      }
    }

    return href.replace(/^\//, "");
  }

  requestHeaders() {
    return {
      "User-Agent": this.userAgent,
      Accept: "*/*",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    };
  }
}

// Exporta para NuvioTV
if (typeof module !== "undefined" && module.exports) {
  module.exports = DattebayoBRScraper;
}
