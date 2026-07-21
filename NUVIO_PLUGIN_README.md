# Plugin Dattebayo BR para NuvioTV

Este é um plugin de scraper JavaScript para o NuvioTV que permite assistir animes do Dattebayo BR.

## 📋 Requisitos

- NuvioTV instalado (versão 0.5.0+)
- Acesso à internet

## 🚀 Instalação

### Via NuvioTV

1. Abra o **NuvioTV**
2. Vá para **Configurações** (ícone de engrenagem)
3. Selecione **Conteúdo & Descoberta**
4. Clique em **Plugins**
5. Selecione **Adicionar Plugin**
6. Cole a URL do repositório:
   ```
   https://raw.githubusercontent.com/ZakiSCzip/anime-extensao-br/repo
   ```
7. Confirme a instalação

## 📖 Como Usar

1. Após instalar o plugin, ele aparecerá na seção de **Plugins** no NuvioTV
2. Busque por animes na interface de busca
3. Selecione um anime
4. Escolha o episódio desejado
5. Selecione a qualidade e reproduza

## 🎥 Qualidades Suportadas

- 1080p (Full HD)
- 720p (HD)
- 480p (SD)
- 360p

## ⚙️ Estrutura do Plugin

```
plugin/
├── nuvio-plugin.json      # Metadados do plugin
├── scraper.js             # Classe do scraper
└── README.md              # Este arquivo
```

## 🛠️ Desenvolvimento

Se você deseja modificar ou desenvolver o plugin:

### Editar o scraper

1. Modifique o arquivo `scraper.js`
2. Teste as mudanças localmente se possível
3. Faça um commit e push para seu repositório

### Atualizar versão

1. Atualize o número da versão em `nuvio-plugin.json`
2. Faça commit com a mensagem: `chore: bump plugin version`

## 📝 Logging

Para debug, você pode abrir o console do NuvioTV:

- Pressione `F12` ou use as ferramentas de desenvolvedor da Android TV

## ⚠️ Limitações

- O parsing depende da estrutura HTML do site Dattebayo BR
- Se o site mudar seu layout, o plugin pode precisar de atualização
- Alguns links podem estar bloqueados ou indisponíveis

## 🤝 Contribuindo

Para reportar bugs ou sugerir melhorias:

- Abra uma issue no repositório
- Descreva o problema com detalhes
- Inclua screenshots se possível

## 📄 Licença

Este plugin segue a mesma licença do repositório original `anime-extensao-br`.

## 🔗 Links Úteis

- [Repositório Original](https://github.com/ZakiSCzip/anime-extensao-br)
- [NuvioTV GitHub](https://github.com/NuvioMedia/NuvioTV)
- [Dattebayo BR](https://www.dattebayo-br.com)

---

**Nota:** Este plugin é um scraper com fins educacionais. Certifique-se de ter o direito de assistir o conteúdo.
