# Imagens das notícias

Esta pasta contém **placeholders SVG** para as 12 notícias mock. Quando o site usa dados mock (Supabase não configurado), as notícias mostram estas imagens.

## Como substituir pelas suas fotos

Para cada notícia, simplesmente coloque uma imagem `.jpg` ou `.png` com o **mesmo nome base** que o SVG correspondente.

Em seguida, edite `script.js` e altere a extensão `.svg` para `.jpg` (ou `.png`) na linha da notícia correspondente.

### Mapa de ficheiros

| ID | Notícia                                          | Ficheiro placeholder            |
|----|--------------------------------------------------|---------------------------------|
| 1  | Clássico decisivo termina em vitória             | `classico-decisivo.svg`         |
| 2  | Jovem talentosa destaca-se na liga nacional      | `jovem-talentosa.svg`           |
| 3  | Preparação intensa para o próximo torneio        | `preparacao-torneio.svg`        |
| 4  | Novo recorde nacional nos 800 metros             | `recorde-800-metros.svg`        |
| 5  | Federação anuncia novo formato da liga           | `novo-formato-liga.svg`         |
| 6  | Equipa nacional estreia-se em prova continental  | `equipa-gt3.svg`                |
| 7  | Jovens promessas brilham no torneio juvenil      | `jovens-promessas.svg`          |
| 8  | Selecção feminina prepara qualificação africana  | `seleccao-feminina.svg`         |
| 9  | Academia de ténis abre em Matola                 | `academia-tenis.svg`            |
| 10 | Treinador nacional renova contrato               | `treinador-renova.svg`          |
| 11 | Maratona de Maputo regista recorde               | `maratona-maputo.svg`           |
| 12 | Clube negoceia regresso de lenda do basquetebol  | `lenda-basquetebol.svg`         |

## Recomendações de imagem

- **Formato**: JPG (melhor compressão para fotografias) ou WebP
- **Dimensões**: pelo menos `1600 × 900px` (16:9)
- **Tamanho**: `< 300 KB` por imagem (use [tinypng.com](https://tinypng.com) para comprimir)
- **Conteúdo**: dramático, focado, com espaço para overlay escuro nos lados/fundo

## Quando o Supabase está activo

Quando faz upload de imagens pelo dashboard admin, elas são guardadas no **Supabase Storage** e o URL fica em `imagem_url` na base de dados. Esta pasta `/images/` apenas serve quando o site está a usar dados mock.
