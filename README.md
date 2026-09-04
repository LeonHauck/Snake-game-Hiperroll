# 🐍 HiperRoll Snake

Um jogo da cobrinha clássico, com visual moderno e a identidade da **HiperRoll Embalagens** — a cobra "come" a logo da marca e, de vez em quando, o mascote **BobRoll** aparece para desbloquear uma fase bônus. Tem placar compartilhado, então dá pra rodar como competição entre várias pessoas jogando de aparelhos diferentes.

Feito para rodar em totens, tablets e celulares em eventos da marca. Sem build, sem frameworks — só HTML, CSS, JS e um mini-backend em PHP para o placar.

---

## 🎮 Como jogar

- Digite um nome (até 10 letras) para entrar no placar
- **Desktop**: setas do teclado ou `W A S D` para mover, `Espaço` para começar, pausar/retomar ou reiniciar a partida
- **Celular/tablet**: arraste o dedo na tela ou use os botões direcionais na parte inferior
- Coma as logos da HiperRoll para crescer e pontuar
- A cada **50 pontos**, o **BobRoll** aparece no lugar da logo normal
- Ao capturar o BobRoll, a cobra entra em **modo bônus**: fica dourada, ganha um pequeno boost de velocidade e o tabuleiro se enche de 13 logos extras para caçar
- Cada BobRoll capturado aumenta o **multiplicador de pontos** (x2, x4, x6...) válido durante a fase bônus daquele momento — esses pontos entram na pontuação total, mas não contam para o próximo Bob Roll aparecer
- Seu recorde pessoal fica salvo no navegador, e sua melhor pontuação entra no **placar Top 5**, visível para qualquer pessoa jogando de qualquer aparelho

## ✨ Funcionalidades

- Visual escuro moderno com gradientes nas cores da marca
- Placar Top 5 compartilhado entre todos os jogadores (qualquer dispositivo), com destaque neon para os 3 primeiros colocados
- Efeitos sonoros retrô gerados via Web Audio API (sem arquivos de áudio externos), incluindo um som e brilho especiais para o BobRoll
- Recorte automático do fundo branco das fotos do BobRoll, direto no navegador (via canvas)
- Buffer de direção: dois comandos rápidos em sequência não se perdem, tornando o controle mais responsivo
- Totalmente responsivo, com controles touch otimizados para celular
- Botão de mudo com preferência salva
- Favicon com a logo da marca

## 🛠️ Tecnologias

- HTML5 Canvas para o jogo
- JavaScript vanilla (sem frameworks)
- Web Audio API para os efeitos sonoros
- PHP + SQLite para o placar compartilhado (sem precisar criar banco de dados no painel de hospedagem)
- `localStorage` para recorde pessoal, nome do jogador e preferência de som

## 📁 Estrutura do projeto

```
Snake-Game/
├── index.html                          # Estrutura da página
├── style.css                           # Visual e responsividade
├── script.js                           # Lógica do jogo
├── assets/
│   ├── Novo-Logotipo-HiperRoll.png     # Logo "comida" principal
│   └── bob-roll/
│       ├── bob-roll-1.jpg              # Fotos do mascote (fundo branco)
│       ├── bob-roll-2.jpg
│       └── ...
├── api/
│   ├── db.php                          # Conexão e criação do banco SQLite
│   ├── leaderboard.php                 # GET — devolve o Top 5
│   ├── submit_score.php                # POST — envia uma pontuação
│   └── data/
│       ├── .htaccess                   # Bloqueia acesso direto ao banco
│       └── scores.db                   # Criado automaticamente no 1º uso
└── README.md
```

## ▶️ Rodando localmente

Como o jogo processa imagens no canvas (para recortar o fundo do Bob Roll) e usa PHP para o placar, abrir o `index.html` direto com duplo clique tem duas limitações:

- O recorte de fundo do BobRoll é bloqueado por restrição de segurança do navegador (`file://`)
- O placar não funciona, já que arquivos `.php` não são executados sem um servidor com PHP

Para testar o visual e o jogo em si, um servidor estático já resolve o recorte de imagem:

```bash
# com Python instalado
python -m http.server 8000
```

Para testar o placar também, é necessário um servidor com PHP (ex: `php -S localhost:8000` com o PHP instalado, ou XAMPP/MAMP). Sem isso, o placar mostra "indisponível" e o jogo segue funcionando normalmente.

## 🚀 Publicando (ex: HostGator)

O projeto é quase todo estático — não precisa de build. Envie via FTP ou Gerenciador de Arquivos para `public_html` (ou uma subpasta):

- `index.html`, `style.css`, `script.js`
- a pasta `assets/` completa
- a pasta `api/` completa (o placar depende dela)

A hospedagem precisa suportar PHP com a extensão SQLite (PDO), o que já vem habilitado por padrão na grande maioria dos planos, incluindo HostGator. Nenhum banco de dados precisa ser criado manualmente no cPanel — o arquivo `api/data/scores.db` é criado sozinho no primeiro acesso, desde que a pasta `api/data/` tenha permissão de escrita (o padrão já costuma funcionar).

> ⚠️ Servidores Linux diferenciam maiúsculas de minúsculas nos nomes de arquivo — mantenha os nomes dos arquivos em `assets/` exatamente como estão no projeto.

> ℹ️ O placar funciona no sistema de honra: não há login nem validação avançada contra pontuações forjadas manualmente via navegador. Para uma competição interna informal isso costuma ser suficiente.

## 🖼️ Adicionando novas fotos do Bob Roll

Salve as fotos em `assets/bob-roll/` seguindo a numeração sequencial, sem pular números:

```
assets/bob-roll/bob-roll-1.jpg
assets/bob-roll/bob-roll-2.jpg
assets/bob-roll/bob-roll-3.jpg
...
```

O jogo detecta automaticamente quantas existem (até 12) e sorteia entre elas a cada fase bônus. Funciona melhor com fotos em fundo branco uniforme.

## 🏆 Sobre o placar

- Guarda a **melhor pontuação de cada nome** (não soma tentativas — jogar de novo só atualiza se superar o recorde anterior daquele nome)
- Nomes duplicados não são impedidos (não há login), então combine com a galera para não repetir nomes na competição
- Para zerar o placar (ex: início de um novo evento), basta apagar o arquivo `api/data/scores.db` no servidor — ele é recriado vazio automaticamente

---

<p align="center">Feito para os eventos da <strong>HiperRoll Embalagens</strong></p>
