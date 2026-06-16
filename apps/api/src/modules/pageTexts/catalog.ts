export type StyleId =
  | "default"
  | "gold-gradient"
  | "primary"
  | "gold"
  | "bold"
  | "uppercase";

export type TextSegment = { text: string; style: StyleId };
export type PageTextValue = string | TextSegment[];

export type PageTextEntry = {
  key: string;
  page: "home" | "franquias" | "assinaturas" | "global";
  section: string;
  label: string;
  type: "simple" | "segmented";
  defaultValue: PageTextValue;
};

export const PAGE_TEXT_CATALOG: ReadonlyArray<PageTextEntry> = [
  // ─── HOME / HERO ─────────────────────────────────────────────────────────────
  { key: "home.hero.badge",         page: "home", section: "hero",         label: "Badge do topo",              type: "simple",    defaultValue: "Redefinindo a Beleza!" },
  { key: "home.hero.title",         page: "home", section: "hero",         label: "Título principal (h1)",      type: "segmented", defaultValue: [{ text: "Sua melhor versão, ", style: "default" }, { text: "Eternizada", style: "gold-gradient" }] },
  { key: "home.hero.subtitle",      page: "home", section: "hero",         label: "Subtítulo do hero",          type: "simple",    defaultValue: "Um santuário exclusivo para cabelo, pele e alma. Viva a interseção entre tecnologia de beleza avançada e bem-estar holístico." },
  { key: "home.hero.cta_primary",   page: "home", section: "hero",         label: "Botão primário",             type: "simple",    defaultValue: "Agende Sua Experiencia" },
  { key: "home.hero.cta_secondary", page: "home", section: "hero",         label: "Botão secundário",           type: "simple",    defaultValue: "Rede de Franquias" },

  // ─── HOME / ABOUT ─────────────────────────────────────────────────────────────
  { key: "home.about.label",         page: "home", section: "about", label: "Label da seção",              type: "simple", defaultValue: "Quem Somos" },
  { key: "home.about.title",         page: "home", section: "about", label: "Título da seção",             type: "simple", defaultValue: "Inovação na Beleza e Estética" },
  { key: "home.about.paragraph_1",   page: "home", section: "about", label: "Parágrafo 1 (use {fullName})", type: "simple", defaultValue: "A {fullName} é uma marca inovadora no setor de beleza e estética, dedicada a oferecer serviços de alta qualidade que proporcionam bem-estar e autoestima aos seus clientes. Temos foco na excelência e no atendimento personalizado, combinamos técnicas modernas e produtos de última geração para atender às tendências e demandas do mercado de cuidados pessoais." },
  { key: "home.about.paragraph_2",   page: "home", section: "about", label: "Parágrafo 2",                 type: "simple", defaultValue: "Nossa missão é transformar a experiência de beleza em algo acessível, acolhedor e inspirador. Buscamos impactar positivamente a vida de nossos clientes, parceiros e franqueados, criando um ambiente que valoriza a qualidade, a inovação e o compromisso com a satisfação." },
  { key: "home.about.stat_1_value",  page: "home", section: "about", label: "Estatística 1 — número",     type: "simple", defaultValue: "15+" },
  { key: "home.about.stat_1_label",  page: "home", section: "about", label: "Estatística 1 — label",      type: "simple", defaultValue: "Anos de Experiência" },
  { key: "home.about.stat_2_value",  page: "home", section: "about", label: "Estatística 2 — número",     type: "simple", defaultValue: "100%" },
  { key: "home.about.stat_2_label",  page: "home", section: "about", label: "Estatística 2 — label",      type: "simple", defaultValue: "Produtos Orgânicos" },
  { key: "home.about.cta_button",    page: "home", section: "about", label: "Botão CTA",                  type: "simple", defaultValue: "Conheça Nossos Produtos" },

  // ─── HOME / CTA ───────────────────────────────────────────────────────────────
  { key: "home.cta.eyebrow",  page: "home", section: "cta", label: "Label acima do título", type: "simple", defaultValue: "Convite Exclusivo" },
  { key: "home.cta.title",    page: "home", section: "cta", label: "Título do CTA",         type: "simple", defaultValue: "Transforme seu autocuidado em rotina, não em luxo" },
  { key: "home.cta.subtitle", page: "home", section: "cta", label: "Subtítulo",             type: "simple", defaultValue: "Entre para o nosso clube VIP e tenha prioridade na agenda com a economia que você sempre quis" },
  { key: "home.cta.button",   page: "home", section: "cta", label: "Botão",                 type: "simple", defaultValue: "ASSINE JÁ !" },

  // ─── HOME / SERVICES ──────────────────────────────────────────────────────────
  { key: "home.services.label",        page: "home", section: "services", label: "Label da seção",    type: "simple", defaultValue: "Nossa Especialidade" },
  { key: "home.services.title",        page: "home", section: "services", label: "Título da seção",   type: "simple", defaultValue: "Tratamentos Personalizados" },
  { key: "home.services.catalog_link", page: "home", section: "services", label: "Link catálogo",     type: "simple", defaultValue: "Ver Menu Completo" },

  { key: "home.services.card_1_front_label",   page: "home", section: "services", label: "Card 1 — título (frente)",    type: "simple", defaultValue: "Arte Capilar" },
  { key: "home.services.card_1_front_tagline", page: "home", section: "services", label: "Card 1 — tagline (frente)",   type: "simple", defaultValue: "Corte preciso e tratamentos restauradores" },
  { key: "home.services.card_1_back_label",    page: "home", section: "services", label: "Card 1 — título (verso)",     type: "simple", defaultValue: "Arte Capilar" },
  { key: "home.services.card_1_back_desc",     page: "home", section: "services", label: "Card 1 — descrição (verso)",  type: "simple", defaultValue: "Coloracao sob medida, reconstrucoes e finalizacao profissional para cada estilo." },

  { key: "home.services.card_2_front_label",   page: "home", section: "services", label: "Card 2 — título (frente)",    type: "simple", defaultValue: "Pele Clinica" },
  { key: "home.services.card_2_front_tagline", page: "home", section: "services", label: "Card 2 — tagline (frente)",   type: "simple", defaultValue: "Faciais avançados e peelings" },
  { key: "home.services.card_2_back_label",    page: "home", section: "services", label: "Card 2 — título (verso)",     type: "simple", defaultValue: "Pele Clínica" },
  { key: "home.services.card_2_back_desc",     page: "home", section: "services", label: "Card 2 — descrição (verso)",  type: "simple", defaultValue: "Protocolos de rejuvenescimento e cuidados intensivos para cada necessidade da pele." },

  { key: "home.services.card_3_front_label",   page: "home", section: "services", label: "Card 3 — título (frente)",    type: "simple", defaultValue: "Terapia de Bem-Estar" },
  { key: "home.services.card_3_front_tagline", page: "home", section: "services", label: "Card 3 — tagline (frente)",   type: "simple", defaultValue: "Massagens e aromaterapia" },
  { key: "home.services.card_3_back_label",    page: "home", section: "services", label: "Card 3 — título (verso)",     type: "simple", defaultValue: "Terapia de Bem-Estar" },
  { key: "home.services.card_3_back_desc",     page: "home", section: "services", label: "Card 3 — descrição (verso)",  type: "simple", defaultValue: "Experiências sensoriais para restaurar energia, equilíbrio e relaxamento profundo." },

  { key: "home.services.card_4_front_label",   page: "home", section: "services", label: "Card 4 — título (frente)",    type: "simple", defaultValue: "Terapia Capilar" },
  { key: "home.services.card_4_front_tagline", page: "home", section: "services", label: "Card 4 — tagline (frente)",   type: "simple", defaultValue: "Saúde dos fios" },
  { key: "home.services.card_4_back_label",    page: "home", section: "services", label: "Card 4 — título (verso)",     type: "simple", defaultValue: "Spa Capilar" },
  { key: "home.services.card_4_back_desc",     page: "home", section: "services", label: "Card 4 — descrição (verso)",  type: "simple", defaultValue: "Tratamentos para couro cabeludo, controle de queda e reconstrução profunda." },

  { key: "home.services.card_5_front_label",   page: "home", section: "services", label: "Card 5 — título (frente)",    type: "simple", defaultValue: "Lashes" },
  { key: "home.services.card_5_front_tagline", page: "home", section: "services", label: "Card 5 — tagline (frente)",   type: "simple", defaultValue: "Extensão de cílios" },
  { key: "home.services.card_5_back_label",    page: "home", section: "services", label: "Card 5 — título (verso)",     type: "simple", defaultValue: "Extensão de Cílios" },
  { key: "home.services.card_5_back_desc",     page: "home", section: "services", label: "Card 5 — descrição (verso)",  type: "simple", defaultValue: "Fio a fio clássico e volume para um olhar marcante e elegante." },

  { key: "home.services.card_6_front_label",   page: "home", section: "services", label: "Card 6 — título (frente)",    type: "simple", defaultValue: "Brows" },
  { key: "home.services.card_6_front_tagline", page: "home", section: "services", label: "Card 6 — tagline (frente)",   type: "simple", defaultValue: "Sobrancelhas" },
  { key: "home.services.card_6_back_label",    page: "home", section: "services", label: "Card 6 — título (verso)",     type: "simple", defaultValue: "Micropigmentação" },
  { key: "home.services.card_6_back_desc",     page: "home", section: "services", label: "Card 6 — descrição (verso)",  type: "simple", defaultValue: "Design estratégico, lamination e técnica shadow para realce natural." },

  { key: "home.services.card_7_front_label",   page: "home", section: "services", label: "Card 7 — título (frente)",    type: "simple", defaultValue: "Facial Spa" },
  { key: "home.services.card_7_front_tagline", page: "home", section: "services", label: "Card 7 — tagline (frente)",   type: "simple", defaultValue: "Estética facial" },
  { key: "home.services.card_7_back_label",    page: "home", section: "services", label: "Card 7 — título (verso)",     type: "simple", defaultValue: "Harmonização" },
  { key: "home.services.card_7_back_desc",     page: "home", section: "services", label: "Card 7 — descrição (verso)",  type: "simple", defaultValue: "Limpeza profunda, peelings e protocolos de rejuvenescimento personalizados." },

  { key: "home.services.card_8_front_label",   page: "home", section: "services", label: "Card 8 — título (frente)",    type: "simple", defaultValue: "Nails" },
  { key: "home.services.card_8_front_tagline", page: "home", section: "services", label: "Card 8 — tagline (frente)",   type: "simple", defaultValue: "Mãos e pés" },
  { key: "home.services.card_8_back_label",    page: "home", section: "services", label: "Card 8 — título (verso)",     type: "simple", defaultValue: "Manicure" },
  { key: "home.services.card_8_back_desc",     page: "home", section: "services", label: "Card 8 — descrição (verso)",  type: "simple", defaultValue: "Esmaltação em gel, alongamentos e spa dos pés." },

  { key: "home.services.card_9_front_label",   page: "home", section: "services", label: "Card 9 — título (frente)",    type: "simple", defaultValue: "Smooth" },
  { key: "home.services.card_9_front_tagline", page: "home", section: "services", label: "Card 9 — tagline (frente)",   type: "simple", defaultValue: "Depilação" },
  { key: "home.services.card_9_back_label",    page: "home", section: "services", label: "Card 9 — título (verso)",     type: "simple", defaultValue: "Depilação" },
  { key: "home.services.card_9_back_desc",     page: "home", section: "services", label: "Card 9 — descrição (verso)",  type: "simple", defaultValue: "Técnicas confortáveis e ceras especiais para uma pele lisa." },

  // ─── HOME / MEMBERSHIP ────────────────────────────────────────────────────────
  { key: "home.membership.label",    page: "home", section: "membership", label: "Label da seção",  type: "simple", defaultValue: "Assinaturas Exclusivas" },
  { key: "home.membership.title",    page: "home", section: "membership", label: "Título da seção", type: "simple", defaultValue: "Quer fazer uma Assinatura e Economizar?" },
  { key: "home.membership.subtitle", page: "home", section: "membership", label: "Subtítulo",       type: "simple", defaultValue: "Escolha o plano que melhor se adapta ao seu estilo de vida e desfrute de benefícios exclusivos, descontos e experiências premium." },

  // ─── HOME / TESTIMONIALS ──────────────────────────────────────────────────────
  { key: "home.testimonials.label",    page: "home", section: "testimonials", label: "Label da seção",  type: "simple", defaultValue: "Depoimentos" },
  { key: "home.testimonials.title",    page: "home", section: "testimonials", label: "Título da seção", type: "simple", defaultValue: "Experiências reais, resultados inesquecíveis" },
  { key: "home.testimonials.subtitle", page: "home", section: "testimonials", label: "Subtítulo",       type: "simple", defaultValue: "Quatro histórias que refletem o cuidado, o luxo e a transformação que entregamos em cada atendimento." },

  { key: "home.testimonials.item_1_quote", page: "home", section: "testimonials", label: "Depoimento 1 — texto (use {fullName})", type: "simple", defaultValue: "\"{fullName} não é apenas um salão, é um botão de reinício para todo o seu ser. Atendimento impecável.\"" },
  { key: "home.testimonials.item_1_name",  page: "home", section: "testimonials", label: "Depoimento 1 — nome",                    type: "simple", defaultValue: "Sarah Jenkins" },
  { key: "home.testimonials.item_1_role",  page: "home", section: "testimonials", label: "Depoimento 1 — cargo",                   type: "simple", defaultValue: "Editora da Vogue" },
  { key: "home.testimonials.item_2_quote", page: "home", section: "testimonials", label: "Depoimento 2 — texto",  type: "simple", defaultValue: "\"O cuidado com cada detalhe transforma o ritual em um momento de calma. Resultado visível desde a primeira visita.\"" },
  { key: "home.testimonials.item_2_name",  page: "home", section: "testimonials", label: "Depoimento 2 — nome",  type: "simple", defaultValue: "Luiza Martins" },
  { key: "home.testimonials.item_2_role",  page: "home", section: "testimonials", label: "Depoimento 2 — cargo", type: "simple", defaultValue: "Diretora Criativa" },
  { key: "home.testimonials.item_3_quote", page: "home", section: "testimonials", label: "Depoimento 3 — texto",  type: "simple", defaultValue: "\"Saio sempre renovado. A equipe entendeu exatamente o que eu queria e o resultado ficou sofisticado.\"" },
  { key: "home.testimonials.item_3_name",  page: "home", section: "testimonials", label: "Depoimento 3 — nome",  type: "simple", defaultValue: "Marcos Nogueira" },
  { key: "home.testimonials.item_3_role",  page: "home", section: "testimonials", label: "Depoimento 3 — cargo", type: "simple", defaultValue: "Consultor de Imagem" },
  { key: "home.testimonials.item_4_quote", page: "home", section: "testimonials", label: "Depoimento 4 — texto",  type: "simple", defaultValue: "\"Produtos premium, atendimento elegante e um clima de spa verdadeiro. Um refugo de luxo no meio da cidade.\"" },
  { key: "home.testimonials.item_4_name",  page: "home", section: "testimonials", label: "Depoimento 4 — nome",  type: "simple", defaultValue: "Ana Ribeiro" },
  { key: "home.testimonials.item_4_role",  page: "home", section: "testimonials", label: "Depoimento 4 — cargo", type: "simple", defaultValue: "Empresária" },

  // ─── FRANQUIAS / HERO ────────────────────────────────────────────────────────
  { key: "franquias.hero.badge",         page: "franquias", section: "hero", label: "Badge do topo",                   type: "simple", defaultValue: "Oportunidades de Franquia" },
  { key: "franquias.hero.title",         page: "franquias", section: "hero", label: "Título principal (use {fullName})", type: "simple", defaultValue: "Leve a {fullName} para sua cidade ou bairro" },
  { key: "franquias.hero.subtitle",      page: "franquias", section: "hero", label: "Subtítulo",                        type: "simple", defaultValue: "Junte-se a rede premier de franquias de beleza de luxo e leve elegância, sofisticação e cuidado de classe mundial para sua comunidade." },
  { key: "franquias.hero.cta_primary",   page: "franquias", section: "hero", label: "Botão primário",                   type: "simple", defaultValue: "Conhecer Modelos" },
  { key: "franquias.hero.cta_secondary", page: "franquias", section: "hero", label: "Botão secundário",                 type: "simple", defaultValue: "Nossa Visão" },

  // ─── FRANQUIAS / MODELS ───────────────────────────────────────────────────────
  { key: "franquias.models.label",    page: "franquias", section: "models", label: "Label da seção",  type: "simple", defaultValue: "Escolha Seu Caminho" },
  { key: "franquias.models.title",    page: "franquias", section: "models", label: "Título da seção", type: "simple", defaultValue: "Modelos de Franquia" },
  { key: "franquias.models.subtitle", page: "franquias", section: "models", label: "Subtítulo",       type: "simple", defaultValue: "Oportunidades de investimento sob medida para atender diferentes mercados e ambições." },

  { key: "franquias.models.card_1_name",       page: "franquias", section: "models", label: "Modelo 1 — nome",             type: "simple", defaultValue: "Esmalteria" },
  { key: "franquias.models.card_1_subtitle",   page: "franquias", section: "models", label: "Modelo 1 — subtítulo",        type: "simple", defaultValue: "Compacto e Boutique" },
  { key: "franquias.models.card_1_investment", page: "franquias", section: "models", label: "Modelo 1 — investimento",     type: "simple", defaultValue: "R$ 200.000,00" },
  { key: "franquias.models.card_1_feat_1",     page: "franquias", section: "models", label: "Modelo 1 — item 1",           type: "simple", defaultValue: "Investimento de Entrada" },
  { key: "franquias.models.card_1_feat_2",     page: "franquias", section: "models", label: "Modelo 1 — item 2",           type: "simple", defaultValue: "Area compacta de 40-60m2" },
  { key: "franquias.models.card_1_feat_3",     page: "franquias", section: "models", label: "Modelo 1 — item 3",           type: "simple", defaultValue: "Ideal para areas de alto fluxo" },
  { key: "franquias.models.card_1_feat_4",     page: "franquias", section: "models", label: "Modelo 1 — item 4",           type: "simple", defaultValue: "Equipe enxuta de 3-5 pessoas" },

  { key: "franquias.models.card_2_name",       page: "franquias", section: "models", label: "Modelo 2 — nome",         type: "simple", defaultValue: "Padrao" },
  { key: "franquias.models.card_2_subtitle",   page: "franquias", section: "models", label: "Modelo 2 — subtítulo",    type: "simple", defaultValue: "Salao Completo" },
  { key: "franquias.models.card_2_investment", page: "franquias", section: "models", label: "Modelo 2 — investimento", type: "simple", defaultValue: "R$ 450.000,00" },
  { key: "franquias.models.card_2_feat_1",     page: "franquias", section: "models", label: "Modelo 2 — item 1",       type: "simple", defaultValue: "Menu de serviços completo" },
  { key: "franquias.models.card_2_feat_2",     page: "franquias", section: "models", label: "Modelo 2 — item 2",       type: "simple", defaultValue: "Area padrao de 80-120m2" },
  { key: "franquias.models.card_2_feat_3",     page: "franquias", section: "models", label: "Modelo 2 — item 3",       type: "simple", defaultValue: "Locais premium em shoppings" },
  { key: "franquias.models.card_2_feat_4",     page: "franquias", section: "models", label: "Modelo 2 — item 4",       type: "simple", defaultValue: "8-12 profissionais" },

  { key: "franquias.models.card_3_name",       page: "franquias", section: "models", label: "Modelo 3 — nome",         type: "simple", defaultValue: "Principal" },
  { key: "franquias.models.card_3_subtitle",   page: "franquias", section: "models", label: "Modelo 3 — subtítulo",    type: "simple", defaultValue: "Experiencia maxima de luxo" },
  { key: "franquias.models.card_3_investment", page: "franquias", section: "models", label: "Modelo 3 — investimento", type: "simple", defaultValue: "R$ 900.000,00" },
  { key: "franquias.models.card_3_feat_1",     page: "franquias", section: "models", label: "Modelo 3 — item 1",       type: "simple", defaultValue: "Presenca iconica na rua" },
  { key: "franquias.models.card_3_feat_2",     page: "franquias", section: "models", label: "Modelo 3 — item 2",       type: "simple", defaultValue: "Area ampla de 150m2+" },
  { key: "franquias.models.card_3_feat_3",     page: "franquias", section: "models", label: "Modelo 3 — item 3",       type: "simple", defaultValue: "Zonas exclusivas de spa" },
  { key: "franquias.models.card_3_feat_4",     page: "franquias", section: "models", label: "Modelo 3 — item 4",       type: "simple", defaultValue: "20+ especialistas" },

  // ─── FRANQUIAS / VISION ───────────────────────────────────────────────────────
  { key: "franquias.vision.label",       page: "franquias", section: "vision", label: "Label da seção",  type: "simple", defaultValue: "A Visão" },
  { key: "franquias.vision.title",       page: "franquias", section: "vision", label: "Título da seção", type: "simple", defaultValue: "Mais que um salão, um santuário de autocuidado." },
  { key: "franquias.vision.quote",       page: "franquias", section: "vision", label: "Citação (círculo)", type: "simple", defaultValue: "\"Beleza não é apenas um serviço, é uma experiência arquitetônica.\"" },
  { key: "franquias.vision.paragraph_1", page: "franquias", section: "vision", label: "Parágrafo 1",      type: "simple", defaultValue: "LR Beauty combina tecnologia de beleza de ponta com elegância atemporal para criar uma experiência inesquecível para cada cliente. Acreditamos que o verdadeiro luxo está nos detalhes - do calor da nossa iluminação à precisão dos nossos tratamentos." },
  { key: "franquias.vision.paragraph_2", page: "franquias", section: "vision", label: "Parágrafo 2",      type: "simple", defaultValue: "Ser nosso parceiro significa entrar em um legado de excelência. Não apenas construímos salões; criamos ambientes onde a confiança floresce. Nossos conceitos arquitetônicos são premiados, pensados para serem funcionais para a equipe e transcendentes para os clientes." },
  { key: "franquias.vision.stat_1_value", page: "franquias", section: "vision", label: "Estatística 1 — número", type: "simple", defaultValue: "10+" },
  { key: "franquias.vision.stat_1_label", page: "franquias", section: "vision", label: "Estatística 1 — label",  type: "simple", defaultValue: "Anos de Liderança" },
  { key: "franquias.vision.stat_2_value", page: "franquias", section: "vision", label: "Estatística 2 — número", type: "simple", defaultValue: "50+" },
  { key: "franquias.vision.stat_2_label", page: "franquias", section: "vision", label: "Estatística 2 — label",  type: "simple", defaultValue: "Unidades no Mundo" },
  { key: "franquias.vision.stat_3_value", page: "franquias", section: "vision", label: "Estatística 3 — número", type: "simple", defaultValue: "98%" },
  { key: "franquias.vision.stat_3_label", page: "franquias", section: "vision", label: "Estatística 3 — label",  type: "simple", defaultValue: "Satisfação dos Parceiros" },

  // ─── FRANQUIAS / FOUNDER ─────────────────────────────────────────────────────
  { key: "franquias.founder.title",       page: "franquias", section: "founder", label: "Nome / Título principal",    type: "simple", defaultValue: "JOSI OLIVEIRA" },
  { key: "franquias.founder.quote",       page: "franquias", section: "founder", label: "Citação (ao lado do título)", type: "simple", defaultValue: "\"A beleza que transforma começa dentro de nós.\"" },
  { key: "franquias.founder.intro",       page: "franquias", section: "founder", label: "Parágrafo intro (negrito)",  type: "simple", defaultValue: "Fundadora e CEO da JLR Beauty House, Josi Oliveira é um verdadeiro exemplo de liderança feminina, visão empreendedora e propósito humano." },
  { key: "franquias.founder.paragraph_1", page: "franquias", section: "founder", label: "Parágrafo 1 (itálico)",      type: "simple", defaultValue: "\"Tudo começou com um sonho.. Um sonho de transformar o cuidado com a beleza em algo muito maior — em um ato de amor, acolhimento, autoestima e autoconfiança.\"" },
  { key: "franquias.founder.paragraph_2", page: "franquias", section: "founder", label: "Parágrafo 2",                type: "simple", defaultValue: "Tudo começou em Janeiro de 2020, quando tinha 32 anos, com olhar sensível e gestão estratégica. Josi conduziu a marca com base em um propósito claro: ajudar mulheres a se sentirem bem consigo mesmas, recuperando a autoconfiança e valorizando o autocuidado diário." },
  { key: "franquias.founder.paragraph_3", page: "franquias", section: "founder", label: "Parágrafo 3",                type: "simple", defaultValue: "Seu estilo de liderança é marcado por empatia, inovação e resultados, inspirando equipes e parceiras a acreditarem no poder de transformar vidas através da beleza." },
  { key: "franquias.founder.paragraph_4", page: "franquias", section: "founder", label: "Parágrafo 4",                type: "simple", defaultValue: "Hoje, aos 37 anos, Josi Oliveira transformou um simples salão em uma marca que inspira mulheres em todo o Brasil: A JLR Beauty House." },
  { key: "franquias.founder.blockquote",  page: "franquias", section: "founder", label: "Blockquote (rodapé texto)",  type: "simple", defaultValue: "Criou um movimento que valoriza a beleza real, a autoestima e o poder de se sentir bem consigo mesma." },
  { key: "franquias.founder.tagline_1",   page: "franquias", section: "founder", label: "Tagline rodapé — linha 1",   type: "simple", defaultValue: "A beleza que acolhe." },
  { key: "franquias.founder.tagline_2",   page: "franquias", section: "founder", label: "Tagline rodapé — linha 2",   type: "simple", defaultValue: "O cuidado que transforma." },

  // ─── FRANQUIAS / BENEFITS ────────────────────────────────────────────────────
  { key: "franquias.benefits.title",      page: "franquias", section: "benefits", label: "Título da seção",    type: "simple", defaultValue: "BENEFÍCIOS PARA O NOSSO FRANQUIADO" },
  { key: "franquias.benefits.cell_1_text", page: "franquias", section: "benefits", label: "Célula 1 — texto", type: "simple", defaultValue: "Capacitação do Empretec" },
  { key: "franquias.benefits.cell_2_text", page: "franquias", section: "benefits", label: "Célula 2 — texto", type: "simple", defaultValue: "Curso de Gestão de pessoas e Liderança" },
  { key: "franquias.benefits.cell_3_text", page: "franquias", section: "benefits", label: "Célula 3 — texto", type: "simple", defaultValue: "Curso de Gestão Financeira" },
  { key: "franquias.benefits.cell_4_text", page: "franquias", section: "benefits", label: "Célula 4 — texto", type: "simple", defaultValue: "Apoio na escolha do ponto" },
  { key: "franquias.benefits.cell_5_text", page: "franquias", section: "benefits", label: "Célula 5 — texto", type: "simple", defaultValue: "Suporte humanizado" },
  { key: "franquias.benefits.cell_6_text", page: "franquias", section: "benefits", label: "Célula 6 — texto", type: "simple", defaultValue: "Apoio na construção de equipe" },
  { key: "franquias.benefits.cell_7_text", page: "franquias", section: "benefits", label: "Célula 7 — texto", type: "simple", defaultValue: "Capacitação da equipe" },
  { key: "franquias.benefits.cell_8_text", page: "franquias", section: "benefits", label: "Célula 8 — texto", type: "simple", defaultValue: "Possibilidade de financiamento de até 40% do modelo de franquia escolhido." },
  { key: "franquias.benefits.cell_9_text", page: "franquias", section: "benefits", label: "Célula 9 — texto", type: "simple", defaultValue: "Possibilidade de Capital de Giro de até R$150.000 com carência de onze meses para pagar a primeira parcela" },

  // ─── FRANQUIAS / FRAN01 — MASTER ────────────────────────────────────────────
  { key: "franquias.fran01.label",           page: "franquias", section: "fran01", label: "Label do modelo",              type: "simple", defaultValue: "MODELO FRANQUIA - MASTER" },
  { key: "franquias.fran01.concept_badge",   page: "franquias", section: "fran01", label: "Badge do conceito",            type: "simple", defaultValue: "3 EM 1" },
  { key: "franquias.fran01.concept_desc",    page: "franquias", section: "fran01", label: "Descrição do conceito",        type: "simple", defaultValue: "Tudo em um só lugar: Salão de Beleza + Esmalteria + Estética Corporal & Facial. Perfeito para quem quer portfólio completo, alto fluxo e experiência integrada." },
  { key: "franquias.fran01.inv_header",      page: "franquias", section: "fran01", label: "Cabeçalho Investimento",       type: "simple", defaultValue: "INVESTIMENTO:" },
  { key: "franquias.fran01.inv_item_1",      page: "franquias", section: "fran01", label: "Investimento — item 1",        type: "simple", defaultValue: "Reforma e Adaptação do Ponto" },
  { key: "franquias.fran01.inv_item_2",      page: "franquias", section: "fran01", label: "Investimento — item 2",        type: "simple", defaultValue: "Materiais de Construção e Acabamento" },
  { key: "franquias.fran01.inv_item_3",      page: "franquias", section: "fran01", label: "Investimento — item 3",        type: "simple", defaultValue: "Equipamento e Decoração Completa" },
  { key: "franquias.fran01.inv_item_4",      page: "franquias", section: "fran01", label: "Investimento — item 4",        type: "simple", defaultValue: "Projeto Arquitetônico" },
  { key: "franquias.fran01.inv_item_5",      page: "franquias", section: "fran01", label: "Investimento — item 5",        type: "simple", defaultValue: "Enxoval Inicial" },
  { key: "franquias.fran01.inv_item_6",      page: "franquias", section: "fran01", label: "Investimento — item 6",        type: "simple", defaultValue: "Kit De Produtos Inicial" },
  { key: "franquias.fran01.fee_label",       page: "franquias", section: "fran01", label: "Taxa de franquia — label",     type: "simple", defaultValue: "TAXA DE FRANQUIA" },
  { key: "franquias.fran01.fee_value",       page: "franquias", section: "fran01", label: "Taxa de franquia — valor",     type: "simple", defaultValue: "R$49.500,00" },
  { key: "franquias.fran01.immediate_label", page: "franquias", section: "fran01", label: "Valor imediato — label",       type: "simple", defaultValue: "VALOR IMEDIATO:" },
  { key: "franquias.fran01.immediate_value", page: "franquias", section: "fran01", label: "Valor imediato — valor",       type: "simple", defaultValue: "R$204.500,00" },
  { key: "franquias.fran01.extra_1_label",   page: "franquias", section: "fran01", label: "Extra 1 — label",              type: "simple", defaultValue: "Capital de Giro" },
  { key: "franquias.fran01.extra_1_value",   page: "franquias", section: "fran01", label: "Extra 1 — valor",              type: "simple", defaultValue: "R$20.000,00" },
  { key: "franquias.fran01.extra_2_label",   page: "franquias", section: "fran01", label: "Extra 2 — label",              type: "simple", defaultValue: "Marketing Inicial" },
  { key: "franquias.fran01.extra_2_value",   page: "franquias", section: "fran01", label: "Extra 2 — valor",              type: "simple", defaultValue: "R$10.000,00" },
  { key: "franquias.fran01.extra_3_label",   page: "franquias", section: "fran01", label: "Extra 3 — label",              type: "simple", defaultValue: "Abertura de Empresa" },
  { key: "franquias.fran01.extra_3_value",   page: "franquias", section: "fran01", label: "Extra 3 — valor",              type: "simple", defaultValue: "R$1.000,00" },
  { key: "franquias.fran01.total_label",     page: "franquias", section: "fran01", label: "Total — label",                type: "simple", defaultValue: "TOTAL:" },
  { key: "franquias.fran01.total_value",     page: "franquias", section: "fran01", label: "Total — valor",                type: "simple", defaultValue: "R$255.200,00" },
  { key: "franquias.fran01.metric_1_label",  page: "franquias", section: "fran01", label: "Métrica 1 — label",            type: "simple", defaultValue: "Payback a partir de" },
  { key: "franquias.fran01.metric_1_value",  page: "franquias", section: "fran01", label: "Métrica 1 — valor",            type: "simple", defaultValue: "17 A 18 MESES" },
  { key: "franquias.fran01.metric_2_label",  page: "franquias", section: "fran01", label: "Métrica 2 — label",            type: "simple", defaultValue: "ROI (Return over investment)" },
  { key: "franquias.fran01.metric_2_value",  page: "franquias", section: "fran01", label: "Métrica 2 — valor",            type: "simple", defaultValue: "5,7% AO MÊS" },
  { key: "franquias.fran01.metric_3_label",  page: "franquias", section: "fran01", label: "Métrica 3 — label",            type: "simple", defaultValue: "Estimativa de Faturamento Anual" },
  { key: "franquias.fran01.metric_3_value",  page: "franquias", section: "fran01", label: "Métrica 3 — valor",            type: "simple", defaultValue: "R$ 540 MIL" },
  { key: "franquias.fran01.metric_4_label",  page: "franquias", section: "fran01", label: "Métrica 4 — label",            type: "simple", defaultValue: "Estimativa de Lucro Anual" },
  { key: "franquias.fran01.metric_4_value",  page: "franquias", section: "fran01", label: "Métrica 4 — valor",            type: "simple", defaultValue: "R$ 161 MIL" },
  { key: "franquias.fran01.metric_5_label",  page: "franquias", section: "fran01", label: "Métrica 5 — label",            type: "simple", defaultValue: "BREAKEVEN (Ponto de Equilíbrio)" },
  { key: "franquias.fran01.metric_5_value",  page: "franquias", section: "fran01", label: "Métrica 5 — valor",            type: "simple", defaultValue: "3 A 4 MESES" },
  { key: "franquias.fran01.metric_6_label",  page: "franquias", section: "fran01", label: "Métrica 6 — label",            type: "simple", defaultValue: "Margem de Lucro" },
  { key: "franquias.fran01.metric_6_value",  page: "franquias", section: "fran01", label: "Métrica 6 — valor",            type: "simple", defaultValue: "30% A 35% AO MÊS" },

  // ─── FRANQUIAS / FRAN02 — PRIME ──────────────────────────────────────────────
  { key: "franquias.fran02.label",           page: "franquias", section: "fran02", label: "Label do modelo",              type: "simple", defaultValue: "MODELO FRANQUIA PRIME" },
  { key: "franquias.fran02.concept_badge",   page: "franquias", section: "fran02", label: "Badge do conceito",            type: "simple", defaultValue: "ESTÉTICA CAPILAR" },
  { key: "franquias.fran02.concept_desc",    page: "franquias", section: "fran02", label: "Descrição do conceito",        type: "simple", defaultValue: "Foco em serviços de cabelo com diferenciais: Terapia Capilar, Mega Hair e Escova Express. Ideal para quem busca especialização e ticket médio atrativo." },
  { key: "franquias.fran02.inv_header",      page: "franquias", section: "fran02", label: "Cabeçalho Investimento",       type: "simple", defaultValue: "INVESTIMENTO:" },
  { key: "franquias.fran02.inv_item_1",      page: "franquias", section: "fran02", label: "Investimento — item 1",        type: "simple", defaultValue: "Reforma e Adaptação do Ponto" },
  { key: "franquias.fran02.inv_item_2",      page: "franquias", section: "fran02", label: "Investimento — item 2",        type: "simple", defaultValue: "Materiais de Construção e Acabamento" },
  { key: "franquias.fran02.inv_item_3",      page: "franquias", section: "fran02", label: "Investimento — item 3",        type: "simple", defaultValue: "Equipamento e Decoração Completa" },
  { key: "franquias.fran02.inv_item_4",      page: "franquias", section: "fran02", label: "Investimento — item 4",        type: "simple", defaultValue: "Projeto Arquitetônico" },
  { key: "franquias.fran02.inv_item_5",      page: "franquias", section: "fran02", label: "Investimento — item 5",        type: "simple", defaultValue: "Enxoval Inicial" },
  { key: "franquias.fran02.inv_item_6",      page: "franquias", section: "fran02", label: "Investimento — item 6",        type: "simple", defaultValue: "Kit De Produtos Inicial" },
  { key: "franquias.fran02.fee_label",       page: "franquias", section: "fran02", label: "Taxa de franquia — label",     type: "simple", defaultValue: "TAXA DE FRANQUIA" },
  { key: "franquias.fran02.fee_value",       page: "franquias", section: "fran02", label: "Taxa de franquia — valor",     type: "simple", defaultValue: "R$49.500,00" },
  { key: "franquias.fran02.immediate_label", page: "franquias", section: "fran02", label: "Valor imediato — label",       type: "simple", defaultValue: "VALOR IMEDIATO:" },
  { key: "franquias.fran02.immediate_value", page: "franquias", section: "fran02", label: "Valor imediato — valor",       type: "simple", defaultValue: "R$206.013,98" },
  { key: "franquias.fran02.extra_1_label",   page: "franquias", section: "fran02", label: "Extra 1 — label",              type: "simple", defaultValue: "Capital de Giro" },
  { key: "franquias.fran02.extra_1_value",   page: "franquias", section: "fran02", label: "Extra 1 — valor",              type: "simple", defaultValue: "R$30.000,00" },
  { key: "franquias.fran02.extra_2_label",   page: "franquias", section: "fran02", label: "Extra 2 — label",              type: "simple", defaultValue: "Marketing Inicial" },
  { key: "franquias.fran02.extra_2_value",   page: "franquias", section: "fran02", label: "Extra 2 — valor",              type: "simple", defaultValue: "R$15.000,00" },
  { key: "franquias.fran02.extra_3_label",   page: "franquias", section: "fran02", label: "Extra 3 — label",              type: "simple", defaultValue: "Abertura de Empresa" },
  { key: "franquias.fran02.extra_3_value",   page: "franquias", section: "fran02", label: "Extra 3 — valor",              type: "simple", defaultValue: "R$1.000,00" },
  { key: "franquias.fran02.total_label",     page: "franquias", section: "fran02", label: "Total — label",                type: "simple", defaultValue: "TOTAL:" },
  { key: "franquias.fran02.total_value",     page: "franquias", section: "fran02", label: "Total — valor",                type: "simple", defaultValue: "R$261.713,98" },
  { key: "franquias.fran02.metric_1_label",  page: "franquias", section: "fran02", label: "Métrica 1 — label",            type: "simple", defaultValue: "Payback a partir de" },
  { key: "franquias.fran02.metric_1_value",  page: "franquias", section: "fran02", label: "Métrica 1 — valor",            type: "simple", defaultValue: "16 A 18 MESES" },
  { key: "franquias.fran02.metric_2_label",  page: "franquias", section: "fran02", label: "Métrica 2 — label",            type: "simple", defaultValue: "ROI (Return over investment)" },
  { key: "franquias.fran02.metric_2_value",  page: "franquias", section: "fran02", label: "Métrica 2 — valor",            type: "simple", defaultValue: "6,4% AO MÊS" },
  { key: "franquias.fran02.metric_3_label",  page: "franquias", section: "fran02", label: "Métrica 3 — label",            type: "simple", defaultValue: "Estimativa de Faturamento Anual" },
  { key: "franquias.fran02.metric_3_value",  page: "franquias", section: "fran02", label: "Métrica 3 — valor",            type: "simple", defaultValue: "R$ 720 MIL" },
  { key: "franquias.fran02.metric_4_label",  page: "franquias", section: "fran02", label: "Métrica 4 — label",            type: "simple", defaultValue: "Estimativa de Lucro Anual" },
  { key: "franquias.fran02.metric_4_value",  page: "franquias", section: "fran02", label: "Métrica 4 — valor",            type: "simple", defaultValue: "R$ 187 MIL" },
  { key: "franquias.fran02.metric_5_label",  page: "franquias", section: "fran02", label: "Métrica 5 — label",            type: "simple", defaultValue: "BREAKEVEN (Ponto de Equilíbrio)" },
  { key: "franquias.fran02.metric_5_value",  page: "franquias", section: "fran02", label: "Métrica 5 — valor",            type: "simple", defaultValue: "4 A 5 MESES" },
  { key: "franquias.fran02.metric_6_label",  page: "franquias", section: "fran02", label: "Métrica 6 — label",            type: "simple", defaultValue: "Margem de Lucro" },
  { key: "franquias.fran02.metric_6_value",  page: "franquias", section: "fran02", label: "Métrica 6 — valor",            type: "simple", defaultValue: "25% A 30% AO MÊS" },

  // ─── FRANQUIAS / FRAN03 — ESSENCIAL I ───────────────────────────────────────
  { key: "franquias.fran03.label",           page: "franquias", section: "fran03", label: "Label do modelo",              type: "simple", defaultValue: "MODELO FRANQUIA – ESSENCIAL I" },
  { key: "franquias.fran03.concept_badge",   page: "franquias", section: "fran03", label: "Badge do conceito",            type: "simple", defaultValue: "MANICURE" },
  { key: "franquias.fran03.concept_desc",    page: "franquias", section: "fran03", label: "Descrição do conceito",        type: "simple", defaultValue: "Operação enxuta e desejada no dia a dia: Manicure e Pedicure. Ótimo para começar com baixo espaço e alta recorrência." },
  { key: "franquias.fran03.inv_header",      page: "franquias", section: "fran03", label: "Cabeçalho Investimento",       type: "simple", defaultValue: "INVESTIMENTO" },
  { key: "franquias.fran03.inv_item_1",      page: "franquias", section: "fran03", label: "Investimento — item 1",        type: "simple", defaultValue: "Reforma e Adaptação do Ponto" },
  { key: "franquias.fran03.inv_item_2",      page: "franquias", section: "fran03", label: "Investimento — item 2",        type: "simple", defaultValue: "Materiais de Construção e Acabamento" },
  { key: "franquias.fran03.inv_item_3",      page: "franquias", section: "fran03", label: "Investimento — item 3",        type: "simple", defaultValue: "Equipamento e Decoração Completa" },
  { key: "franquias.fran03.inv_item_4",      page: "franquias", section: "fran03", label: "Investimento — item 4",        type: "simple", defaultValue: "Projeto Arquitetônico" },
  { key: "franquias.fran03.inv_item_5",      page: "franquias", section: "fran03", label: "Investimento — item 5",        type: "simple", defaultValue: "Enxoval Inicial" },
  { key: "franquias.fran03.inv_item_6",      page: "franquias", section: "fran03", label: "Investimento — item 6",        type: "simple", defaultValue: "Kit De Produtos Inicial" },
  { key: "franquias.fran03.fee_label",       page: "franquias", section: "fran03", label: "Taxa de franquia — label",     type: "simple", defaultValue: "TAXA DE FRANQUIA" },
  { key: "franquias.fran03.fee_value",       page: "franquias", section: "fran03", label: "Taxa de franquia — valor",     type: "simple", defaultValue: "R$40.000,00" },
  { key: "franquias.fran03.immediate_label", page: "franquias", section: "fran03", label: "Valor imediato — label",       type: "simple", defaultValue: "VALOR IMEDIATO:" },
  { key: "franquias.fran03.immediate_value", page: "franquias", section: "fran03", label: "Valor imediato — valor",       type: "simple", defaultValue: "R$120.300,00" },
  { key: "franquias.fran03.extra_1_label",   page: "franquias", section: "fran03", label: "Extra 1 — label",              type: "simple", defaultValue: "Capital de Giro" },
  { key: "franquias.fran03.extra_1_value",   page: "franquias", section: "fran03", label: "Extra 1 — valor",              type: "simple", defaultValue: "R$10.000,00" },
  { key: "franquias.fran03.extra_2_label",   page: "franquias", section: "fran03", label: "Extra 2 — label",              type: "simple", defaultValue: "Marketing Inicial" },
  { key: "franquias.fran03.extra_2_value",   page: "franquias", section: "fran03", label: "Extra 2 — valor",              type: "simple", defaultValue: "R$10.000,00" },
  { key: "franquias.fran03.extra_3_label",   page: "franquias", section: "fran03", label: "Extra 3 — label",              type: "simple", defaultValue: "Abertura de Empresa" },
  { key: "franquias.fran03.extra_3_value",   page: "franquias", section: "fran03", label: "Extra 3 — valor",              type: "simple", defaultValue: "R$1.000,00" },
  { key: "franquias.fran03.total_label",     page: "franquias", section: "fran03", label: "Total — label",                type: "simple", defaultValue: "TOTAL:" },
  { key: "franquias.fran03.total_value",     page: "franquias", section: "fran03", label: "Total — valor",                type: "simple", defaultValue: "R$161.500,00" },
  { key: "franquias.fran03.metric_1_label",  page: "franquias", section: "fran03", label: "Métrica 1 — label",            type: "simple", defaultValue: "Payback a partir de" },
  { key: "franquias.fran03.metric_1_value",  page: "franquias", section: "fran03", label: "Métrica 1 — valor",            type: "simple", defaultValue: "17 A 18 MESES" },
  { key: "franquias.fran03.metric_2_label",  page: "franquias", section: "fran03", label: "Métrica 2 — label",            type: "simple", defaultValue: "ROI (Return over investment)" },
  { key: "franquias.fran03.metric_2_value",  page: "franquias", section: "fran03", label: "Métrica 2 — valor",            type: "simple", defaultValue: "5,9% AO MÊS" },
  { key: "franquias.fran03.metric_3_label",  page: "franquias", section: "fran03", label: "Métrica 3 — label",            type: "simple", defaultValue: "Estimativa de Faturamento Anual" },
  { key: "franquias.fran03.metric_3_value",  page: "franquias", section: "fran03", label: "Métrica 3 — valor",            type: "simple", defaultValue: "R$ 528 MIL" },
  { key: "franquias.fran03.metric_4_label",  page: "franquias", section: "fran03", label: "Métrica 4 — label",            type: "simple", defaultValue: "Estimativa de Lucro Anual" },
  { key: "franquias.fran03.metric_4_value",  page: "franquias", section: "fran03", label: "Métrica 4 — valor",            type: "simple", defaultValue: "R$ 99 MIL" },
  { key: "franquias.fran03.metric_5_label",  page: "franquias", section: "fran03", label: "Métrica 5 — label",            type: "simple", defaultValue: "BREAKEVEN (Ponto de Equilíbrio)" },
  { key: "franquias.fran03.metric_5_value",  page: "franquias", section: "fran03", label: "Métrica 5 — valor",            type: "simple", defaultValue: "4 A 5 MESES" },
  { key: "franquias.fran03.metric_6_label",  page: "franquias", section: "fran03", label: "Métrica 6 — label",            type: "simple", defaultValue: "Margem de Lucro" },
  { key: "franquias.fran03.metric_6_value",  page: "franquias", section: "fran03", label: "Métrica 6 — valor",            type: "simple", defaultValue: "18% A 20% AO MÊS" },

  // ─── FRANQUIAS / GESTAO APP ──────────────────────────────────────────────────
  { key: "franquias.gestao_app.title",          page: "franquias", section: "gestao_app", label: "Título da seção",        type: "simple", defaultValue: "DADOS E GESTÃO NA PALMA DA MÃO" },
  { key: "franquias.gestao_app.feature_1_title", page: "franquias", section: "gestao_app", label: "Feature 1 — título",   type: "simple", defaultValue: "PRÓ VENDA" },
  { key: "franquias.gestao_app.feature_1_desc",  page: "franquias", section: "gestao_app", label: "Feature 1 — descrição", type: "simple", defaultValue: "App proprietário utilizado pelo vendedor. Contém todas as informações de estoque físico e online, dados do cliente, promoções e uma série de ferramentas para auxiliá-lo na venda." },
  { key: "franquias.gestao_app.feature_2_title", page: "franquias", section: "gestao_app", label: "Feature 2 — título",   type: "simple", defaultValue: "PRÓ ESTOQUE" },
  { key: "franquias.gestao_app.feature_2_desc",  page: "franquias", section: "gestao_app", label: "Feature 2 — descrição", type: "simple", defaultValue: "App proprietário utilizado para gestão do estoque pelos funcionários da loja." },
  { key: "franquias.gestao_app.feature_3_title", page: "franquias", section: "gestao_app", label: "Feature 3 — título",   type: "simple", defaultValue: "MOTOR DE PROMOÇÃO" },
  { key: "franquias.gestao_app.feature_3_desc",  page: "franquias", section: "gestao_app", label: "Feature 3 — descrição", type: "simple", defaultValue: "Ferramenta que possibilita o disparo de inúmeras combinações de promoções personalizadas para os clientes." },
  { key: "franquias.gestao_app.feature_4_title", page: "franquias", section: "gestao_app", label: "Feature 4 — título",   type: "simple", defaultValue: "RECOMENDAÇÃO AUTOMÁTICA" },
  { key: "franquias.gestao_app.feature_4_desc",  page: "franquias", section: "gestao_app", label: "Feature 4 — descrição", type: "simple", defaultValue: "Ferramenta que oferta produtos adicionais, baseada em inteligência artificial." },

  // ─── FRANQUIAS / FLUXO CAIXA ─────────────────────────────────────────────────
  { key: "franquias.fluxo_caixa.title",          page: "franquias", section: "fluxo_caixa", label: "Título da seção",       type: "simple", defaultValue: "FLUXO DE CAIXA SIMPLIFICADO" },
  { key: "franquias.fluxo_caixa.feature_1_title", page: "franquias", section: "fluxo_caixa", label: "Feature 1 — título",  type: "simple", defaultValue: "SIMULADOR DE RESULTADOS" },
  { key: "franquias.fluxo_caixa.feature_1_desc",  page: "franquias", section: "fluxo_caixa", label: "Feature 1 — descrição", type: "simple", defaultValue: "Ferramenta que descreve automaticamente 3 planos de ação para o cenário desejado." },
  { key: "franquias.fluxo_caixa.feature_2_title", page: "franquias", section: "fluxo_caixa", label: "Feature 2 — título",  type: "simple", defaultValue: "BI" },
  { key: "franquias.fluxo_caixa.feature_2_desc",  page: "franquias", section: "fluxo_caixa", label: "Feature 2 — descrição", type: "simple", defaultValue: "Controle de todos os indicadores da loja e dos colaboradores via aplicativo, com informações em tempo real." },
  { key: "franquias.fluxo_caixa.feature_3_title", page: "franquias", section: "fluxo_caixa", label: "Feature 3 — título",  type: "simple", defaultValue: "CONTADOR DE FLUXO" },
  { key: "franquias.fluxo_caixa.feature_3_desc",  page: "franquias", section: "fluxo_caixa", label: "Feature 3 — descrição", type: "simple", defaultValue: "Análise do funil de compras completo, com percentual de aproveitamento por etapa da venda, por vendedor e por periodo." },

  // ─── FRANQUIAS / MARKETING CRM ───────────────────────────────────────────────
  { key: "franquias.marketing_crm.title",    page: "franquias", section: "marketing_crm", label: "Título da seção",  type: "simple", defaultValue: "MARKETING, CRM E VISUAL MERCHANDISING" },
  { key: "franquias.marketing_crm.item_1",   page: "franquias", section: "marketing_crm", label: "Item 1",           type: "simple", defaultValue: "11 Campanhas nacionais fixas por ano + campanhas regionais" },
  { key: "franquias.marketing_crm.item_2",   page: "franquias", section: "marketing_crm", label: "Item 2",           type: "simple", defaultValue: "Materiais de comunicação de loja customizados por região" },
  { key: "franquias.marketing_crm.item_3",   page: "franquias", section: "marketing_crm", label: "Item 3",           type: "simple", defaultValue: "Desenvolvimento de ações exclusivas para o franqueado" },
  { key: "franquias.marketing_crm.item_4",   page: "franquias", section: "marketing_crm", label: "Item 4 (CRM)",     type: "simple", defaultValue: "Gestão centralizada do CRM" },
  { key: "franquias.marketing_crm.sub_1",    page: "franquias", section: "marketing_crm", label: "CRM — sub 1",      type: "simple", defaultValue: "Segmentação inteligente do público-alvo" },
  { key: "franquias.marketing_crm.sub_2",    page: "franquias", section: "marketing_crm", label: "CRM — sub 2",      type: "simple", defaultValue: "Customização de mensagens e ofertas" },
  { key: "franquias.marketing_crm.sub_3",    page: "franquias", section: "marketing_crm", label: "CRM — sub 3",      type: "simple", defaultValue: "Acompanhamento e otimização continua da jornada do cliente" },
  { key: "franquias.marketing_crm.item_5",   page: "franquias", section: "marketing_crm", label: "Item 5",           type: "simple", defaultValue: "Equipe exclusiva para suporte" },
  { key: "franquias.marketing_crm.tip",      page: "franquias", section: "marketing_crm", label: "Dica de negócio",  type: "simple", defaultValue: "Atuar com parceria corporativa, prédios residenciais e comércios de bairros. Uma forma diferente de fazer negócios." },

  // ─── FRANQUIAS / EXPANSAO ────────────────────────────────────────────────────
  { key: "franquias.expansao.title",       page: "franquias", section: "expansao", label: "Título da seção",  type: "simple", defaultValue: "EXPANSÃO" },
  { key: "franquias.expansao.paragraph_1", page: "franquias", section: "expansao", label: "Parágrafo 1",      type: "simple", defaultValue: "Nosso modelo de franquia foi pensado para escalar com eficiência, combinando suporte próximo, operação simples e inteligência de território para abrir com segurança e crescer com previsibilidade." },
  { key: "franquias.expansao.paragraph_2", page: "franquias", section: "expansao", label: "Parágrafo 2",      type: "simple", defaultValue: "Se você quer levar a melhor franquia para sua região de São Paulo ou Grande São Paulo, este é o momento: conheça as áreas com maior demanda e veja como abrir sua unidade pode começar hoje mesmo, no seu bairro, com o nosso time ao lado do primeiro planejamento à inauguração." },
  { key: "franquias.expansao.quote_1",     page: "franquias", section: "expansao", label: "Destaque 1",       type: "simple", defaultValue: "Descubra o potencial da sua cidade" },
  { key: "franquias.expansao.quote_2",     page: "franquias", section: "expansao", label: "Destaque 2",       type: "simple", defaultValue: "Agende uma visita com nosso especialista para avaliar sua praça" },
  { key: "franquias.expansao.quote_3",     page: "franquias", section: "expansao", label: "Destaque 3",       type: "simple", defaultValue: "Leve a melhor franquia para sua região" },

  // ─── FRANQUIAS / PERFIL FRANQUEADO ───────────────────────────────────────────
  { key: "franquias.perfil.title",  page: "franquias", section: "perfil", label: "Título da seção", type: "simple", defaultValue: "PERFIL DO FRANQUEADO" },
  { key: "franquias.perfil.item_1", page: "franquias", section: "perfil", label: "Item 1",          type: "simple", defaultValue: "Identificação com a marca, estilo e filosofia" },
  { key: "franquias.perfil.item_2", page: "franquias", section: "perfil", label: "Item 2",          type: "simple", defaultValue: "Comprometimento com os padrões de franquias" },
  { key: "franquias.perfil.item_3", page: "franquias", section: "perfil", label: "Item 3",          type: "simple", defaultValue: "Participação nas ações promovidas pela empresa" },
  { key: "franquias.perfil.item_4", page: "franquias", section: "perfil", label: "Item 4",          type: "simple", defaultValue: "Capacidade financeira comprovada" },
  { key: "franquias.perfil.item_5", page: "franquias", section: "perfil", label: "Item 5",          type: "simple", defaultValue: "Dedicação ao negócio" },
  { key: "franquias.perfil.item_6", page: "franquias", section: "perfil", label: "Item 6",          type: "simple", defaultValue: "Espírito empreendedor" },
  { key: "franquias.perfil.item_7", page: "franquias", section: "perfil", label: "Item 7",          type: "simple", defaultValue: "Perfil de liderança e facilidade para trabalhar em equipe" },

  // ─── FRANQUIAS / SUPORTE FRANQUEADORA ────────────────────────────────────────
  { key: "franquias.suporte.title",        page: "franquias", section: "suporte", label: "Título da seção",          type: "simple", defaultValue: "SUPORTE DA FRANQUEADORA" },
  { key: "franquias.suporte.g1_title",     page: "franquias", section: "suporte", label: "Grupo 1 — título",         type: "simple", defaultValue: "Definição do Ponto Comercial" },
  { key: "franquias.suporte.g1_item_1",    page: "franquias", section: "suporte", label: "Grupo 1 — item 1",         type: "simple", defaultValue: "Suporte na escolha e negociação do ponto comercial" },
  { key: "franquias.suporte.g1_item_2",    page: "franquias", section: "suporte", label: "Grupo 1 — item 2",         type: "simple", defaultValue: "Auxílio na análise total do investimento" },
  { key: "franquias.suporte.g1_item_3",    page: "franquias", section: "suporte", label: "Grupo 1 — item 3",         type: "simple", defaultValue: "Suporte Jurídico" },
  { key: "franquias.suporte.g2_title",     page: "franquias", section: "suporte", label: "Grupo 2 — título",         type: "simple", defaultValue: "Montagem e Implantação" },
  { key: "franquias.suporte.g2_item_1",    page: "franquias", section: "suporte", label: "Grupo 2 — item 1",         type: "simple", defaultValue: "Elaboração Projeto Arquitetônico" },
  { key: "franquias.suporte.g2_item_2",    page: "franquias", section: "suporte", label: "Grupo 2 — item 2",         type: "simple", defaultValue: "Implantação e acompanhamento da obra" },
  { key: "franquias.suporte.g2_item_3",    page: "franquias", section: "suporte", label: "Grupo 2 — item 3",         type: "simple", defaultValue: "Suporte no Recrutamento e Seleção" },
  { key: "franquias.suporte.g2_item_4",    page: "franquias", section: "suporte", label: "Grupo 2 — item 4",         type: "simple", defaultValue: "Integração do Franqueado" },
  { key: "franquias.suporte.g2_item_5",    page: "franquias", section: "suporte", label: "Grupo 2 — item 5",         type: "simple", defaultValue: "Treinamento presencial da equipe" },
  { key: "franquias.suporte.g2_item_6",    page: "franquias", section: "suporte", label: "Grupo 2 — item 6",         type: "simple", defaultValue: "Equipe para montagem e inauguração da loja" },
  { key: "franquias.suporte.g2_item_7",    page: "franquias", section: "suporte", label: "Grupo 2 — item 7",         type: "simple", defaultValue: "Estratégia de marketing inaugural" },
  { key: "franquias.suporte.g3_title",     page: "franquias", section: "suporte", label: "Grupo 3 — título",         type: "simple", defaultValue: "Operação" },
  { key: "franquias.suporte.g3_item_1",    page: "franquias", section: "suporte", label: "Grupo 3 — item 1",         type: "simple", defaultValue: "Consultoria de campo remoto e presencial" },
  { key: "franquias.suporte.g3_item_2",    page: "franquias", section: "suporte", label: "Grupo 3 — item 2",         type: "simple", defaultValue: "Treinamentos periódicos" },
  { key: "franquias.suporte.g3_item_3",    page: "franquias", section: "suporte", label: "Grupo 3 — Suporte (label)", type: "simple", defaultValue: "Suporte" },
  { key: "franquias.suporte.g3_subitems",  page: "franquias", section: "suporte", label: "Grupo 3 — sub-itens (\\n)", type: "simple", defaultValue: "Marketing\nVisual Merchandising\nFinanceiro\nVendas\nTecnologia" },

  // ─── FRANQUIAS / ETAPAS ABERTURA ─────────────────────────────────────────────
  { key: "franquias.etapas.title",   page: "franquias", section: "etapas", label: "Título da seção", type: "simple", defaultValue: "ETAPAS DE ABERTURA" },
  { key: "franquias.etapas.step_1",  page: "franquias", section: "etapas", label: "Etapa 1",         type: "simple", defaultValue: "Análise Inicial" },
  { key: "franquias.etapas.step_2",  page: "franquias", section: "etapas", label: "Etapa 2",         type: "simple", defaultValue: "Envio dos dados do candidato para aprovação" },
  { key: "franquias.etapas.step_3",  page: "franquias", section: "etapas", label: "Etapa 3",         type: "simple", defaultValue: "Assinatura da COF" },
  { key: "franquias.etapas.step_4",  page: "franquias", section: "etapas", label: "Etapa 4",         type: "simple", defaultValue: "Pré-contrato" },
  { key: "franquias.etapas.step_5",  page: "franquias", section: "etapas", label: "Etapa 5",         type: "simple", defaultValue: "Escolha e Negociação do Ponto" },
  { key: "franquias.etapas.step_6",  page: "franquias", section: "etapas", label: "Etapa 6",         type: "simple", defaultValue: "Assinatura do Contrato" },
  { key: "franquias.etapas.step_7",  page: "franquias", section: "etapas", label: "Etapa 7",         type: "simple", defaultValue: "Pagamento da Taxa de Franquia" },
  { key: "franquias.etapas.step_8",  page: "franquias", section: "etapas", label: "Etapa 8",         type: "simple", defaultValue: "Início da Implantação" },
  { key: "franquias.etapas.step_9",  page: "franquias", section: "etapas", label: "Etapa 9",         type: "simple", defaultValue: "Cronograma de Inauguração" },
  { key: "franquias.etapas.step_10", page: "franquias", section: "etapas", label: "Etapa 10",        type: "simple", defaultValue: "Inauguração" },
  { key: "franquias.etapas.cta",     page: "franquias", section: "etapas", label: "Botão CTA final",  type: "simple", defaultValue: "Vamos construir algo espetacular juntos!" },

  // ─── FRANQUIAS / CONTACT ──────────────────────────────────────────────────────
  { key: "franquias.contact.title",        page: "franquias", section: "contact", label: "Título da seção", type: "simple", defaultValue: "Seja um Parceiro" },
  { key: "franquias.contact.subtitle",     page: "franquias", section: "contact", label: "Subtítulo",       type: "simple", defaultValue: "Preencha o formulario abaixo para receber nosso dossiê completo de franquias." },
  { key: "franquias.contact.button",       page: "franquias", section: "contact", label: "Botão enviar",    type: "simple", defaultValue: "Seja um Franqueado" },
  { key: "franquias.contact.privacy_note", page: "franquias", section: "contact", label: "Nota de privacidade", type: "simple", defaultValue: "Ao enviar este formulário, você concorda com nossa política de privacidade." },

  // ─── GLOBAL / MISSION ────────────────────────────────────────────────────────
  { key: "global.mission.missao_title",   page: "global", section: "mission", label: "Missão — título",      type: "simple", defaultValue: "MISSÃO" },
  { key: "global.mission.missao_text",    page: "global", section: "mission", label: "Missão — parágrafo",   type: "simple", defaultValue: "Transformar vidas através da beleza, oferecendo experiências que unem autocuidado, acolhimento e resultados reais." },
  { key: "global.mission.visao_title",    page: "global", section: "mission", label: "Visão — título",       type: "simple", defaultValue: "VISÃO" },
  { key: "global.mission.visao_text",     page: "global", section: "mission", label: "Visão — parágrafo",    type: "simple", defaultValue: "Ser reconhecida como uma rede que inspira mulheres a se amarem mais todos os dias — levando o conceito três em um para todo o Brasil." },
  { key: "global.mission.valores_title",  page: "global", section: "mission", label: "Valores — título",     type: "simple", defaultValue: "VALORES:" },
  { key: "global.mission.valores_item_1", page: "global", section: "mission", label: "Valores — item 1",     type: "simple", defaultValue: "Cuidar com empatia." },
  { key: "global.mission.valores_item_2", page: "global", section: "mission", label: "Valores — item 2",     type: "simple", defaultValue: "Valorizar a essência de cada pessoa." },
  { key: "global.mission.valores_item_3", page: "global", section: "mission", label: "Valores — item 3",     type: "simple", defaultValue: "Acreditar que beleza é bem-estar." },
  { key: "global.mission.valores_item_4", page: "global", section: "mission", label: "Valores — item 4",     type: "simple", defaultValue: "Inovar sempre, com amor e propósito." },
  { key: "global.mission.valores_item_5", page: "global", section: "mission", label: "Valores — item 5",     type: "simple", defaultValue: "Trabalhar com ética, respeito e paixão." },

  // ─── ASSINATURAS / HERO ───────────────────────────────────────────────────────
  { key: "assinaturas.hero.title",      page: "assinaturas", section: "hero", label: "Título principal",  type: "segmented", defaultValue: [{ text: "Viva seu melhor ", style: "default" }, { text: "Estilo!", style: "gold-gradient" }] },
  { key: "assinaturas.hero.subtitle_1", page: "assinaturas", section: "hero", label: "Subtítulo linha 1", type: "simple",    defaultValue: "Aqui está a solução para conseguir cuidar da sua autoestima em meio à sua rotina super corrida!" },
  { key: "assinaturas.hero.subtitle_2", page: "assinaturas", section: "hero", label: "Subtítulo linha 2", type: "simple",    defaultValue: "Garanta um visual de alto padrão com um valor fixo mensal que custa menos do que três visitas avulsas!" },
  { key: "assinaturas.hero.subtitle_3", page: "assinaturas", section: "hero", label: "Subtítulo linha 3", type: "simple",    defaultValue: "assinantes têm acesso a horários exclusivos e agendamento prioritário via app." },

  { key: "assinaturas.hero.card_1_title", page: "assinaturas", section: "hero", label: "Card 1 — título",    type: "simple",    defaultValue: "Assine e Economize" },
  { key: "assinaturas.hero.card_1_desc",  page: "assinaturas", section: "hero", label: "Card 1 — descrição", type: "segmented", defaultValue: [{ text: "Assine um de nossos planos e use ", style: "default" }, { text: "Ilimitadamente", style: "bold" }, { text: " nossos serviços", style: "default" }] },
  { key: "assinaturas.hero.card_2_title", page: "assinaturas", section: "hero", label: "Card 2 — título",    type: "simple",    defaultValue: "Agende e Visite" },
  { key: "assinaturas.hero.card_2_desc",  page: "assinaturas", section: "hero", label: "Card 2 — descrição", type: "simple",    defaultValue: "Agende seu horário facilmente utilizando nosso aplicativo e venha nos visitar" },
  { key: "assinaturas.hero.card_3_title", page: "assinaturas", section: "hero", label: "Card 3 — título",    type: "simple",    defaultValue: "Pronto !!" },
  { key: "assinaturas.hero.card_3_desc",  page: "assinaturas", section: "hero", label: "Card 3 — descrição", type: "simple",    defaultValue: "Aproveite o seu momento e fique pronta em até 60 min!" },
];

export const PAGE_TEXTS_CATALOG_MAP = new Map<string, PageTextEntry>(
  PAGE_TEXT_CATALOG.map((entry) => [entry.key, entry])
);

export const getPageTextDefault = (key: string): PageTextValue => {
  return PAGE_TEXTS_CATALOG_MAP.get(key)?.defaultValue ?? "";
};
