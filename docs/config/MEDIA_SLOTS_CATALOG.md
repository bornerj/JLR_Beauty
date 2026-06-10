# Media Slots Catalog (PLAN-0007)

Data de referencia: 2026-02-28

## Escopo
- Este catalogo cobre apenas imagens institucionais do site.
- Exclusoes explicitas:
  - logo (controlada por `settings.public.branding.logoUrl`);
  - imagens do catalogo de produtos (controladas pelo cadastro de produtos).

## Matriz `slot -> imagem fallback -> local`
| Slot | Pagina | Secao | Fallback atual | Local de exibicao |
|---|---|---|---|---|
| `home_hero_bg_01` | home | hero | `https://lh3.googleusercontent.com/...` | Hero da Home (fundo principal) |
| `home_about_img_01` | home | about | `/images/about_img1.webp` | Home About colagem coluna 1 item 1 |
| `home_about_img_02` | home | about | `/images/about_img2.webp` | Home About colagem coluna 1 item 2 |
| `home_about_img_03` | home | about | `/images/about_img3.webp` | Home About colagem coluna 1 item 3 |
| `home_about_img_04` | home | about | `/images/about_img4.webp` | Home About colagem coluna 2 item 1 |
| `home_about_img_05` | home | about | `/images/about_img5.webp` | Home About colagem coluna 2 item 2 |
| `home_about_img_06` | home | about | `/images/about_img6.webp` | Home About colagem coluna 2 item 3 |
| `home_about_img_07` | home | about | `/images/about_img7.webp` | Home About colagem coluna 3 item 1 |
| `home_about_img_08` | home | about | `/images/about_img1.webp` | Home About colagem coluna 3 item 2 |
| `home_services_card_img_01` | home | services | `https://lh3.googleusercontent.com/...` | Home Serviços flip-card 1 |
| `home_services_card_img_02` | home | services | `https://lh3.googleusercontent.com/...` | Home Serviços flip-card 2 |
| `home_services_card_img_03` | home | services | `https://lh3.googleusercontent.com/...` | Home Serviços flip-card 3 |
| `home_services_card_img_04` | home | services | `/images/hidra.webp` | Home Serviços flip-card 4 |
| `home_services_card_img_05` | home | services | `/images/Services/servico3.webp` | Home Serviços flip-card 5 |
| `home_services_card_img_06` | home | services | `/images/Services/servico2.webp` | Home Serviços flip-card 6 |
| `home_services_card_img_07` | home | services | `https://images.unsplash.com/photo-1570172619644-dfd03ed5d881...` | Home Serviços flip-card 7 |
| `home_services_card_img_08` | home | services | `https://images.unsplash.com/photo-1604654894610-df63bc536371...` | Home Serviços flip-card 8 |
| `home_services_card_img_09` | home | services | `https://images.unsplash.com/photo-1552693673-1bf958298935...` | Home Serviços flip-card 9 |
| `home_testimonials_avatar_01` | home | testimonials | `/images/profis/pessoa1.webp` | Home Depoimentos avatar 1 |
| `home_testimonials_avatar_02` | home | testimonials | `/images/profis/pessoa2.webp` | Home Depoimentos avatar 2 |
| `home_testimonials_avatar_03` | home | testimonials | `/images/profis/pessoa3.webp` | Home Depoimentos avatar 3 |
| `home_testimonials_avatar_04` | home | testimonials | `/images/profis/pessoa4.webp` | Home Depoimentos avatar 4 |
| `franquias_hero_bg_map_01` | franquias | hero | `/images/franchise/mapa_fundo.webp` | Franquias Hero mapa de fundo |
| `franquias_hero_gallery_img_01` | franquias | hero | `/images/franchise/franquias_img1.webp` | Franquias Hero colagem 1 |
| `franquias_hero_gallery_img_02` | franquias | hero | `/images/franchise/franquias_img2.webp` | Franquias Hero colagem 2 |
| `franquias_hero_gallery_img_03` | franquias | hero | `/images/franchise/franquias_img3.webp` | Franquias Hero colagem 3 |
| `franquias_hero_gallery_img_04` | franquias | hero | `/images/franchise/franquias_img4.webp` | Franquias Hero colagem 4 |
| `franquias_hero_gallery_img_05` | franquias | hero | `/images/franchise/franquias_img5.webp` | Franquias Hero colagem 5 |
| `franquias_hero_gallery_img_06` | franquias | hero | `/images/franchise/franquias_img6.webp` | Franquias Hero colagem 6 |
| `franquias_hero_gallery_img_07` | franquias | hero | `/images/franchise/franquias_img7.webp` | Franquias Hero colagem 7 |
| `franquias_hero_gallery_img_08` | franquias | hero | `/images/franchise/franquias_img8.webp` | Franquias Hero colagem 8 |
| `franquias_models_card_img_01` | franquias | models | `/images/franchise/franquias_img7.webp` | Franquias Modelos card Esmalteria |
| `franquias_models_card_img_02` | franquias | models | `/images/franchise/franquias_img4.webp` | Franquias Modelos card Padrao |
| `franquias_models_card_img_03` | franquias | models | `/images/franchise/franquias_img1.webp` | Franquias Modelos card Principal |
| `franquias_vision_img_01` | franquias | vision | `https://lh3.googleusercontent.com/...` | Franquias Visao imagem editorial |
| `assinaturas_hero_bg_01` | assinaturas | hero | `/images/hero3.webp` | Assinaturas Hero fundo principal |
| `assinaturas_hero_card_img_01` | assinaturas | hero | `/images/about_img2.webp` | Assinaturas Hero card 1 |
| `assinaturas_hero_card_img_02` | assinaturas | hero | `/images/about_img4.webp` | Assinaturas Hero card 2 |
| `assinaturas_hero_card_img_03` | assinaturas | hero | `/images/about_img3.webp` | Assinaturas Hero card 3 |
| `checkout_whatsapp_icon_01` | checkout | contact | `/images/whatsapp-icon-button.svg` | Checkout CTA "Fale Conosco" |

