/// <reference path="./online-streaming-provider.d.ts" />

class Provider {
  private baseUrl = "https://www.dattebayo-br.com";
  private userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

  getSettings(): Settings {
    return {
      episodeServers: ["Dattebayo BR"],
      supportsDub: false,
    };
  }

  async search(opts: SearchOptions): Promise<SearchResult[]> {
    const rawQuery = opts.query.trim();
    if (!rawQuery) return [];

    // Limit query to first three words to avoid overlong titles confusing the
    // remote search (e.g. apps sending very long generated titles).
    const query = this.limitTitleToThreeWords(rawQuery);

    try {
      const url = `${this.baseUrl}/busca?busca=${encodeURIComponent(query)}&page=1`;
      const resp = await fetch(url, { headers: this.requestHeaders() });
      if (!resp.ok) return [];

      const html = await resp.text();
      const $ = LoadDoc(html);
      const results: SearchResult[] = [];

      $("div.ultimosAnimesHomeItem").each((_: any, el: any) => {
        const href = el.find("a").attr("href") || "";
        const path = this.extractPath(href);
        if (!path) return;

        const fullTitle =
          el.find(".ultimosAnimesHomeItemInfosNome").text().trim() ||
          "Sem título";
        const title = this.limitTitleToThreeWords(fullTitle);
        results.push({
          id: path,
          title: title,
          url: `${this.baseUrl}/${path}`,
          subOrDub: "sub",
        });
      });

      return results;
    } catch (e) {
      console.error("Search failed:", e);
      return [];
    }
  }

  async findEpisodes(id: string): Promise<EpisodeDetails[]> {
    const episodes: EpisodeDetails[] = [];
    const seen = new Set<string>();
    const cleanId = id.replace(/^\//, "").replace(/\/page\/\d+$/, "");
    const basePath = `${this.baseUrl}/${cleanId}`;

    try {
      for (let page = 1; page <= 30; page++) {
        const pageUrl = page === 1 ? basePath : `${basePath}/page/${page}`;
        let html: string;

        try {
          const resp = await fetch(pageUrl, { headers: this.requestHeaders() });
          if (!resp.ok) break;
          html = await resp.text();
        } catch {
          break;
        }

        const $ = LoadDoc(html);
        const items = $("div.ultimosEpisodiosHomeItem");
        if (items.length === 0) break;

        let addedAny = false;
        items.each((_: any, el: any) => {
          const href = el.find("a").attr("href") || "";
          if (!href || seen.has(href)) return;
          seen.add(href);

          const rawNum = el
            .find(".ultimosEpisodiosHomeItemInfosNum")
            .text()
            .replace(/Episódio/gi, "")
            .trim();
          const number = parseFloat(rawNum.replace(",", "."));
          if (isNaN(number)) return;

          const name =
            el.find(".ultimosEpisodiosHomeItemInfosNome").text().trim() ||
            `Episódio ${rawNum}`;

          const epUrl = href.startsWith("http")
            ? href
            : `${this.baseUrl}${href}`;

          episodes.push({
            id: href.replace(/^\//, ""),
            number: number,
            title: name,
            url: epUrl,
          });
          addedAny = true;
        });

        if (!addedAny) break;
      }
    } catch (e) {
      console.error("Failed to fetch episodes:", e);
    }

    episodes.sort((a, b) => a.number - b.number);
    return episodes;
  }

  async findEpisodeServer(
    episode: EpisodeDetails,
    _server: string,
  ): Promise<EpisodeServer> {
    try {
      const resp = await fetch(episode.url, { headers: this.requestHeaders() });
      if (!resp.ok) {
        throw new Error(`Failed to fetch episode page: ${resp.status}`);
      }

      const html = await resp.text();
      const $ = LoadDoc(html);

      interface TabInfo {
        quality: string;
        rawUrl: string;
      }

      const tabs: TabInfo[] = [];

      $("div.AbasBox div.Aba").each((_: any, tab: any) => {
        const name = tab.text().trim().toUpperCase();
        const attr = tab.attr("aba-type");
        if (!attr) return;

        const keep =
          name.includes("FULLHD") ||
          name.includes("FULL HD") ||
          name.includes("1080") ||
          name.includes("HD") ||
          name.includes("720") ||
          name.includes("SD") ||
          name.includes("480");
        if (!keep) return;

        const container = $(`#${attr}`);
        if (container.length === 0) return;

        let rawUrl = this.extractVideoUrl($, container);
        if (!rawUrl) return;
        if (rawUrl.startsWith("//")) rawUrl = "https:" + rawUrl;

        tabs.push({
          quality: this.decorateQuality(name),
          rawUrl: rawUrl,
        });
      });

      const videoSources: VideoSource[] = [];

      for (const tab of tabs) {
        let finalUrl = tab.rawUrl;
        if (!finalUrl.includes("X-Amz-Signature")) {
          const suffix = await this.resolveAdsSuffix(finalUrl);
          if (suffix) finalUrl += suffix;
        }
        videoSources.push({
          url: finalUrl,
          type: finalUrl.endsWith(".m3u8") ? "m3u8" : "mp4",
          quality: tab.quality,
          subtitles: [],
        });
      }

      return {
        server: "Dattebayo BR",
        headers: {
          Referer: episode.url,
          "User-Agent": this.userAgent,
          Origin: this.baseUrl,
        },
        videoSources: videoSources,
      };
    } catch (e) {
      console.error("Failed to find episode server:", e);
      throw e;
    }
  }
  private limitTitleToThreeWords(title: string): string {
    const words = title.trim().split(/\s+/);
    return words.slice(0, 3).join(" ");
  }
  private extractPath(href: string): string {
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

  private extractVideoUrl($: any, container: any): string {
    const html = container.html() || "";

    const match = html.match(/var vid\s*=\s*['"](.*?)['"]/);
    if (match && match[1]) return match[1];

    const match2 = html.match(
      /(?:let|const|window\.)?\s*vid\s*=\s*['"](.*?)['"]/,
    );
    if (match2 && match2[1]) return match2[1];

    const src = container.find("video source[src], source[src]").attr("src");
    if (src) return src;

    return "";
  }

  private async resolveAdsSuffix(vid: string): Promise<string> {
    try {
      const url = `https://ads.animeyabu.net?url=${encodeURIComponent(vid)}`;
      const resp = await fetch(url, {
        headers: {
          Referer: `${this.baseUrl}/`,
          Origin: this.baseUrl,
          Accept: "application/json, text/plain, */*",
          "User-Agent": this.userAgent,
        },
      });
      const text = await resp.text();
      if (text.includes("publicidade")) {
        const arr = JSON.parse(text);
        if (Array.isArray(arr) && arr.length > 0 && arr[0].publicidade) {
          return arr[0].publicidade;
        }
      }
    } catch (e) {
      console.error("Failed to resolve ads suffix:", e);
    }
    return "";
  }

  private decorateQuality(tabName: string): string {
    const upper = tabName.toUpperCase();
    if (
      upper.includes("FULLHD") ||
      upper.includes("FULL HD") ||
      upper.includes("1080")
    ) {
      return "FULLHD 1080p";
    }
    if (upper.includes("HD") || upper.includes("720")) {
      return "HD 720p";
    }
    if (upper.includes("SD") || upper.includes("480")) {
      return "SD 480p";
    }
    if (upper.includes("360")) {
      return "SD 360p";
    }
    return tabName;
  }

  private requestHeaders(): Record<string, string> {
    return {
      "User-Agent": this.userAgent,
      Accept: "*/*",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    };
  }
}
