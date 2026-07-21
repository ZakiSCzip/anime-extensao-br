# ⚡ Quick Start - Plugin NuvioTV

## 5 Passos para Usar Seu Plugin

### 1️⃣ Repositório Pronto

✅ Seu repositório já está estruturado com:

```
https://github.com/ZakiSCzip/anime-extensao-br/repo
```

### 2️⃣ Instalar no NuvioTV

No seu Android TV com NuvioTV instalado:

1. Abra **NuvioTV**
2. Vá para **Configurações** ⚙️
3. **Conteúdo & Descoberta**
4. **Plugins** → **Adicionar Plugin**
5. Cole:
   ```
   https://raw.githubusercontent.com/ZakiSCzip/anime-extensao-br/repo
   ```
6. Confirme

### 3️⃣ Usar o Plugin

- Volte para home
- Procure por animes na **busca**
- Selecione um anime
- Escolha episódio
- Selecione qualidade e reproduza

### 4️⃣ Testar Localmente (Opcional)

Se você tem Node.js:

```bash
# Copie os arquivos scraper.js e test-scraper.js
# para seu projeto local, depois:

node test-scraper.js
```

Você verá:

```
🧪 Iniciando testes...
📍 Teste 1: Busca por 'Naruto'
✓ Encontrados X resultados
...
✅ Testes completados!
```

### 5️⃣ Atualizar o Plugin

Se precisar fazer mudanças:

1. Edit `scraper.js`
2. Atualizar versão em `nuvio-plugin.json`
3. Faça commit e push
4. No NuvioTV: **Atualizar Plugin** (automático ou manual)

---

## 📝 Arquivos Criados

```
📦 seu-repo/
 ├─ nuvio-plugin.json          ← Metadados (NuvioTV descobre aqui)
 ├─ scraper.js                 ← Código do scraper (motor)
 ├─ NUVIO_PLUGIN_README.md      ← Guia completo
 ├─ ARCHITECTURE.md             ← Documentação técnica
 ├─ test-scraper.js             ← Testes
 └─ QUICK_START.md              ← Este arquivo
```

---

## ❓ Perguntas Frequentes

**P: Como faço para testar antes de instalar?**
R: Você pode rodar `test-scraper.js` localmente com Node.js para validar

**P: O plugin suporta múltiplas fontes?**
R: Sim! Você pode adicionar mais scrapers modificando `nuvio-plugin.json`

**P: O que fazer se os links quebram?**
R: Se o site Dattebayo BR mudar layout, você precisará atualizar os regexes em `scraper.js`

**P: Posso usar em outro Android TV?**
R: Sim! Qualquer dispositivo com NuvioTV pode instalar o plugin

**P: Como reportar bugs?**
R: Abra uma issue no GitHub com detalhes do erro

---

## 🎬 Próximos Passos

1. **Deploy**: Seus arquivos já estão prontos! Nada mais a fazer
2. **Testar**: Instale no NuvioTV e teste a busca
3. **Melhorar**: Adicione mais fontes conforme necessário
4. **Manter**: Atualize os regexes se o site mudar

---

## 💡 Dicas Profissionais

- Use `console.log()` para debug no NuvioTV (F12)
- Mantenha versão sincronizada com seu repositório
- Teste novo HTML parsing em `test-scraper.js` antes de aplicar
- Documente mudanças no commit message

---

**Pronto para instalar? Vá para NuvioTV → Plugins → Adicionar** 🚀

Qualquer dúvida, consulte `ARCHITECTURE.md` para detalhes técnicos.
