# 🐍 Hiper Roll Snake

Um jogo da cobrinha clássico, com visual moderno e a identidade da **Hiper Roll Embalagens** — a cobra "come" a logo da marca e, de vez em quando, o mascote **Bob Roll** aparece para desbloquear uma fase bônus.

Feito para rodar em totens, tablets e celulares em eventos da marca. Sem instalação, sem dependências, sem build — é só abrir e jogar.

---

## 🎮 Como jogar

- **Desktop**: setas do teclado ou `W A S D` para mover, `Espaço` para pausar/retomar ou começar/reiniciar a partida
- **Celular/tablet**: arraste o dedo na tela ou use os botões direcionais na parte inferior
- Coma as logos da Hiper Roll para crescer e pontuar
- A cada **50 pontos**, o **Bob Roll** aparece no lugar da logo normal
- Ao capturar o Bob Roll, a cobra entra em **modo bônus**: fica dourada, ganha um pequeno boost de velocidade e o tabuleiro se enche de logos extras para caçar
- Cada Bob Roll capturado aumenta o **multiplicador de pontos** (x2, x4, x6...) válido durante a fase bônus daquele momento
- Bata seu recorde — ele fica salvo no navegador

## ✨ Funcionalidades

- Visual escuro moderno com gradientes nas cores da marca
- Efeitos sonoros retrô gerados via Web Audio API (sem arquivos de áudio externos)
- Recorte automático do fundo branco das fotos do Bob Roll, direto no navegador (via canvas)
- Totalmente responsivo, com controles touch otimizados para celular
- Botão de mudo com preferência salva
- Zero dependências externas — HTML, CSS e JavaScript puros

## 🛠️ Tecnologias

- HTML5 Canvas para o jogo
- JavaScript vanilla (sem frameworks)
- Web Audio API para os efeitos sonoros
- `localStorage` para recorde e preferência de som

## 📁 Estrutura do projeto

```
Snake-Game/
├── index.html              # Estrutura da página
├── style.css                # Visual e responsividade
├── script.js                 # Lógica do jogo
├── assets/
│   ├── Novo-Logotipo-HiperRoll.png   # Logo "comida" principal
│   └── bob-roll/
│       ├── bob-roll-1.jpg     # Fotos do mascote (fundo branco)
│       ├── bob-roll-2.jpg
│       └── ...
└── README.md
```

## ▶️ Rodando localmente

Como o jogo processa imagens no canvas (para recortar o fundo do Bob Roll), abrir o `index.html` direto com duplo clique pode bloquear esse recorte por restrição de segurança do navegador (`file://`). Para testar com tudo funcionando, sirva a pasta por um servidor local:

```bash
# com Python instalado
python -m http.server 8000
```

Depois acesse `http://localhost:8000` no navegador.

## 🚀 Publicando (ex: HostGator)

O projeto é 100% estático — não precisa de build nem servidor especial. Basta enviar os arquivos (`index.html`, `style.css`, `script.js` e a pasta `assets/`) via FTP ou Gerenciador de Arquivos para `public_html` (ou uma subpasta). Servido por `http://` ou `https://`, o recorte de fundo das fotos funciona normalmente.

> ⚠️ Servidores Linux diferenciam maiúsculas de minúsculas nos nomes de arquivo — mantenha os nomes dos arquivos em `assets/` exatamente como estão no projeto.

## 🖼️ Adicionando novas fotos do Bob Roll

Salve as fotos em `assets/bob-roll/` seguindo a numeração sequencial, sem pular números:

```
assets/bob-roll/bob-roll-1.jpg
assets/bob-roll/bob-roll-2.jpg
assets/bob-roll/bob-roll-3.jpg
...
```

O jogo detecta automaticamente quantas existem (até 12) e sorteia entre elas a cada fase bônus. Funciona melhor com fotos em fundo branco uniforme.

---

<p align="center">Feito para os eventos da <strong>Hiper Roll Embalagens</strong></p>
