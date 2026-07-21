# 🏗️ Arquitetura do Plugin NuvioTV - Dattebayo BR

## Visão Geral

Este documento descreve como o plugin funciona internamente e como se integra com o NuvioTV.

## 📊 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                        NuvioTV App                          │
├─────────────────────────────────────────────────────────────┤
│  1. Usuário busca por "Naruto"                              │
│  2. NuvioTV carrega plugin via nuvio-plugin.json            │
│  3. Instancia DattebayoBRScraper                            │
│  4. Chama método search("Naruto")                           │
└──────────────────┬────────────────────────────────────────┘
                   │
          ┌────────▼─────────┐
          │  scraper.js      │
          │                  │
          │ class:           │
          │ - search()       │
          │ - getEpisodes()  │
          │ - getStreams()   │
          │ - parseHTML()    │
          └────────┬─────────┘
                   │
          ┌────────▼──────────────────────────┐
          │  HTTP Requests                    │
          │  https://www.dattebayo-br.com    │
          └────────┬──────────────────────────┘
                   │
          ┌────────▼──────────────────────────┐
          │  HTML Parsing & Regex             │
          │  - Extrai resultados              │
          │  - Extrai episódios               │
          │  - Extrai links de vídeo          │
          └────────┬──────────────────────────┘
                   │
          ┌────────▼──────────────────────────┐
          │  Retorna JSON                     │
          │  [                                 │
          │    {                               │
          │      id: "path/anime",             │
          │      title: "Naruto",              │
          │      url: "...",                   │
          │      type: "series"                │
          │    }                               │
          │  ]                                 │
          └──────────────────────────────────┘
```

## 📁 Estrutura de Arquivos

```
seu-repo/
├── nuvio-plugin.json           # Metadados do plugin (descoberta)
├── scraper.js                  # Implementação do scraper
├── NUVIO_PLUGIN_README.md      # Guia de uso
├── ARCHITECTURE.md             # Este arquivo
└── test-scraper.js             # Testes unitários
```

## 🔄 Ciclo de Vida do Plugin

### 1. Instalação

```
Usuário cola URL do repositório
        ↓
NuvioTV baixa nuvio-plugin.json
        ↓
Valida estrutura
        ↓
Carrega scraper.js na memória
        ↓
Plugin disponível para uso
```

### 2. Busca

```
search("Naruto")
        ↓
Constrói URL: https://www.dattebayo-br.com/busca?busca=Naruto&page=1
        ↓
Faz requisição HTTP
        ↓
Recebe HTML
        ↓
Usa Regex: /ultimosAnimesHomeItem[\s\S]*?href="([^"]*)"[\s\S]*?ultimosAnimesHomeItemInfosNome">([^<]+)/g
        ↓
Extrai: ID, Título, URL
        ↓
Retorna array de resultados
```

### 3. Episódios

```
getEpisodes(animeId)
        ↓
Para cada página (máx 30):
  - Constrói URL
  - Faz requisição
  - Extrai episódios com Regex
  - Evita duplicatas com Set()
        ↓
Ordena por número
        ↓
Retorna lista ordenada
```

### 4. Streams

```
getStreams(episodeUrl)
        ↓
Faz requisição para a página do episódio
        ↓
Extrai abas de qualidade com Regex
        ↓
Para cada aba (1080p, 720p, etc.):
  - Extrai o container
  - Busca var vid = "..."
  - Valida e normaliza URL
        ↓
Retorna array com URLs de stream
```

## 🎯 Métodos Principais

### `search(query: string): Promise<Array>`

**Entrada:**

- `query`: String de busca (ex: "Naruto")

**Saída:**

```javascript
[
  {
    id: "anime/naruto", // ID único do anime
    title: "Naruto", // Título limitado a 3 palavras
    url: "https://www.dattebayo...", // URL completa
    type: "series", // Tipo de conteúdo
  },
];
```

### `getEpisodes(animeId: string): Promise<Array>`

**Entrada:**

- `animeId`: ID do anime obtido em search()

**Saída:**

```javascript
[
  {
    id: "anime/naruto/episodio-1",
    number: 1,
    title: "O Nascimento de um Ninja",
    url: "https://www.dattebayo...",
  },
  {
    id: "anime/naruto/episodio-2",
    number: 2,
    title: "Meu Rival",
    url: "https://www.dattebayo...",
  },
];
```

### `getStreams(episodeUrl: string): Promise<Array>`

**Entrada:**

- `episodeUrl`: URL do episódio obtida em getEpisodes()

**Saída:**

```javascript
[
  {
    url: "https://stream-url.com/video.m3u8",
    quality: "1080p",
    type: "hls", // ou "http" para MP4
    referer: "https://www.dattebayo-br.com/...",
  },
  {
    url: "https://stream-url.com/video720.mp4",
    quality: "720p",
    type: "http",
    referer: "https://www.dattebayo-br.com/...",
  },
];
```

## 🔍 Estratégia de Parsing

### 1. HTML Estruturado

Esperamos HTML com estrutura como:

```html
<div class="ultimosAnimesHomeItem">
  <a href="/anime/naruto">Naruto</a>
  <span class="ultimosAnimesHomeItemInfosNome">Naruto</span>
</div>
```

### 2. Regex Patterns

- **Busca:** `/ultimosAnimesHomeItem[\s\S]*?href="([^"]*)"[\s\S]*?ultimosAnimesHomeItemInfosNome">([^<]+)/g`
- **Episódios:** `/ultimosEpisodiosHomeItem[\s\S]*?href="([^"]*)"[\s\S]*?ultimosEpisodiosHomeItemInfosNum">([^<]+)/g`
- **Streams:** `/var vid\s*=\s*['"](.*?)['"]/i`

### 3. Tratamento de Erros

- Requisição falha? → Retorna array vazio
- HTML mal formatado? → Pula item e continua
- Duplicata? → Usa Set() para evitar

## ⚡ Otimizações

1. **Limita títulos a 3 palavras** - Evita confusão de nomes longos
2. **Máximo 30 páginas** - Previne loops infinitos
3. **Deduplica episódios** - Usa Set() para rastrear URLs
4. **Cache implícito** - Browser/NuvioTV fazem cache de requisições

## 🚨 Problemas Conhecidos

| Problema                     | Causa                 | Solução                |
| ---------------------------- | --------------------- | ---------------------- |
| Busca não retorna resultados | Site mudou layout     | Atualizar regexes      |
| Episódios não carregam       | Paginação diferente   | Validar estrutura HTML |
| Links 404                    | Servidor indisponível | Tentar novamente       |
| HTML encode/decode           | Caracteres especiais  | Normalizar strings     |

## 🔧 Como Debugar

### No NuvioTV

```
1. Pressione F12 (Developer Tools)
2. Abra console
3. Procure por erros de rede ou script
```

### Localmente (Node.js)

```javascript
const scraper = new DattebayoBRScraper();
console.log(await scraper.search("Naruto"));
```

## 📈 Roadmap de Melhorias

- [ ] Usar DOM parser real em vez de Regex
- [ ] Adicionar cache de resultados
- [ ] Suporte a alternativas de streaming
- [ ] Tratamento de proxy/VPN
- [ ] Logs estruturados
- [ ] Múltiplos servidores de episódio

---

**Versão:** 1.0.0  
**Última atualização:** 2026-07-20  
**Status:** Funcional ✅
