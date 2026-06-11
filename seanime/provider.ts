/// <reference path="./online-streaming-provider.d.ts" />

class Provider {
    baseUrl = "https://www.dattebayo-br.com"
    adsEndpoint = "https://ads.animeyabu.net"
    userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

    getSettings(): Settings {
        return {
            episodeServers: ["Dattebayo BR"],
            supportsDub: false,
        }
    }

    async search(opts: SearchOptions): Promise<SearchResult[]> {
        const query = opts.query.trim()
        if (!query) return []

        const url = `${this.baseUrl}/busca?busca=${encodeURIComponent(query)}&page=1`
        const resp = await fetch(url, { headers: this.requestHeaders() })
        const html = await resp.text()
        const $ = LoadDoc(html)
        const results: SearchResult[] = []

        $("div.ultimosAnimesHomeItem").each((_: any, el: any) => {
            const link = el.find("a").attr("href") || ""
            const title = el.find(".ultimosAnimesHomeItemInfosNome").text().trim() || "Sem título"
            results.push({
                id: link.replace(/^\//, ""),
                title: title,
                url: `${this.baseUrl}${link}`,
                subOrDub: "sub",
            })
        })

        return results
    }

    async findEpisodes(id: string): Promise<EpisodeDetails[]> {
        const episodes: EpisodeDetails[] = []
        const seen = new Set<string>()
        const basePath = `${this.baseUrl}/${id.replace(/^\//, "").replace(/\/page\/\d+$/, "")}`

        for (let page = 1; page <= 50; page++) {
            const pageUrl = page === 1 ? basePath : `${basePath}/page/${page}`
            let html: string
            try {
                const resp = await fetch(pageUrl, { headers: this.requestHeaders() })
                html = await resp.text()
            } catch {
                break
            }

            const $ = LoadDoc(html)
            const items = $("div.ultimosEpisodiosHomeItem")
            if (items.length === 0) break

            let addedAny = false
            items.each((_: any, el: any) => {
                const link = el.find("a").attr("href") || ""
                if (!link || seen.has(link)) return
                seen.add(link)

                const rawNum = el.find(".ultimosEpisodiosHomeItemInfosNum").text()
                    .replace(/Episódio/gi, "").trim()
                const number = parseFloat(rawNum.replace(",", "."))
                if (isNaN(number)) return

                const name = el.find(".ultimosEpisodiosHomeItemInfosNome").text().trim()
                    || `Episódio ${rawNum}`

                episodes.push({
                    id: link.replace(/^\//, ""),
                    number: number,
                    title: name,
                    url: `${this.baseUrl}${link}`,
                })
                addedAny = true
            })

            if (!addedAny) break
        }

        episodes.sort((a, b) => b.number - a.number)
        return episodes
    }

    async findEpisodeServer(episode: EpisodeDetails, _server: string): Promise<EpisodeServer> {
        const resp = await fetch(episode.url, { headers: this.requestHeaders() })
        const html = await resp.text()
        const $ = LoadDoc(html)

        interface TabInfo {
            quality: string
            rawUrl: string
        }

        const tabs: TabInfo[] = []

        $("div.AbasBox div.Aba").each((_: any, tab: any) => {
            const name = tab.text().trim().toUpperCase()
            const attr = tab.attr("aba-type")
            if (!attr) return

            const keep = name.includes("FULLHD") || name.includes("FULL HD")
                || name.includes("1080") || name.includes("HD")
                || name.includes("720") || name.includes("SD")
                || name.includes("480")
            if (!keep) return

            const container = $(`#${attr}`)
            if (container.length === 0) return

            let rawUrl = this.extractVideoUrl(container)
            if (!rawUrl) return
            if (rawUrl.startsWith("//")) rawUrl = "https:" + rawUrl

            tabs.push({
                quality: this.decorateQuality(name),
                rawUrl: rawUrl,
            })
        })

        const videoSources: VideoSource[] = await Promise.all(
            tabs.map(async (tab) => {
                let finalUrl = tab.rawUrl
                if (!finalUrl.includes("X-Amz-Signature")) {
                    const suffix = await this.resolveAdsSuffix(finalUrl)
                    if (suffix) finalUrl += suffix
                }
                return {
                    url: finalUrl,
                    type: finalUrl.endsWith(".m3u8") ? "m3u8" : "mp4",
                    quality: tab.quality,
                    subtitles: [],
                }
            })
        )

        return {
            server: "Dattebayo BR",
            headers: {
                "Referer": episode.url,
                "User-Agent": this.userAgent,
                "Origin": this.baseUrl,
            },
            videoSources: videoSources,
        }
    }

    private extractVideoUrl(container: any): string {
        const html = container.html() || ""

        const match = html.match(/var vid\s*=\s*['"](.*?)['"]/)
        if (match && match[1]) return match[1]

        const match2 = html.match(/(?:let|const|window\.)?\s*vid\s*=\s*['"](.*?)['"]/)
        if (match2 && match2[1]) return match2[1]

        const src = container.find("video source[src], source[src]").attr("src")
        if (src) return src

        return ""
    }

    private async resolveAdsSuffix(vid: string): Promise<string> {
        const url = `${this.adsEndpoint}?url=${encodeURIComponent(vid)}`
        try {
            const resp = await fetch(url, {
                headers: {
                    "Referer": `${this.baseUrl}/`,
                    "Origin": this.baseUrl,
                    "Accept": "application/json, text/plain, */*",
                    "User-Agent": this.userAgent,
                },
            })
            const text = await resp.text()
            if (text.includes("publicidade")) {
                const arr = JSON.parse(text)
                if (Array.isArray(arr) && arr.length > 0 && arr[0].publicidade) {
                    return arr[0].publicidade
                }
            }
        } catch (e) {
            console.error("Failed to resolve ads suffix", e)
        }
        return ""
    }

    private decorateQuality(tabName: string): string {
        const upper = tabName.toUpperCase()
        if (upper.includes("FULLHD") || upper.includes("FULL HD") || upper.includes("1080")) {
            return "FULLHD 1080p"
        }
        if (upper.includes("HD") || upper.includes("720")) {
            return "HD 720p"
        }
        if (upper.includes("SD") || upper.includes("480")) {
            return "SD 480p"
        }
        if (upper.includes("360")) {
            return "SD 360p"
        }
        return tabName
    }

    private requestHeaders(): Record<string, string> {
        return {
            "User-Agent": this.userAgent,
            "Accept": "*/*",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "X-Requested-With": "XMLHttpRequest",
        }
    }
}
