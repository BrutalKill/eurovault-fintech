{
  "meta": {
    "product": "Plataforma de Investimento (Europa, EUR) — Cliente + Admin CRM",
    "design_personality": [
      "premium",
      "sofisticado",
      "confiável",
      "alto foco em conversão",
      "dark-mode only",
      "estética de broker europeu"
    ],
    "language": "pt-PT",
    "currency": "EUR",
    "tone_of_voice": {
      "do": [
        "claro e objetivo",
        "terminologia financeira europeia (SEPA, IBAN)",
        "microcopy de confiança (segurança, encriptação, conformidade)"
      ],
      "dont": [
        "gírias",
        "promessas agressivas (ex.: 'garantido')",
        "tom 'crypto hype'"
      ]
    },
    "layout_principles": {
      "client_area": "Dashboard com sidebar fixa + header com ações rápidas. Conteúdo em cards e grids. Chart como foco acima da dobra.",
      "admin_area": "Back-office/CRM com layout mais denso: tables, filtros, badges de status, painéis laterais (sheet/drawer) para detalhes; toasts com som para eventos."
    }
  },

  "brand_attributes": {
    "trust_signals": [
      "selos/ícones discretos (SSL, 2FA, Segurança de Pagamento)",
      "microcopy junto ao formulário de depósito (PCI, encriptação, não armazenamos CVV)",
      "estado de processamento com progress + textos (Evite parecer 'travado')",
      "data e hora em formato europeu + timezone"
    ],
    "conversion_hooks": [
      "CTA primário sempre visível no contexto (Depositar / Confirmar)",
      "saldo e P/L em destaque no header",
      "news com ‘impact tags’ (Macro, FX, Ações)"
    ]
  },

  "inspiration_refs": {
    "patterns_to_borrow": [
      {
        "source": "Dribbble search: dark trading / crypto dashboard",
        "takeaways": [
          "cards com borda sutil + sombras internas",
          "accent neon controlado (azul elétrico)",
          "tabelas com sticky header e densidade ajustável"
        ]
      },
      {
        "source": "TradingView dark chart UI",
        "takeaways": [
          "contraste alto para candles/linhas",
          "toolbar discreta",
          "foco no gráfico, ruído visual mínimo"
        ]
      },
      {
        "source": "Back-office CRM templates (admin tables)",
        "takeaways": [
          "filtros em linha + search",
          "ações em linha (status pills) + drawer de detalhes",
          "toasts para eventos em tempo real"
        ]
      }
    ]
  },

  "color_system": {
    "notes": [
      "Dark mode only. Sem light mode.",
      "Usar azul elétrico como ação primária e ouro metálico como acento premium (nunca em gradientes escuros).",
      "Evitar roxos/gradientes saturados (regra geral)."
    ],
    "tokens_css": "@layer base {\n  :root {\n    /* --- Base surfaces (dark-only) --- */\n    --background: 240 33% 5%;        /* ~ #0a0a0f */\n    --foreground: 220 20% 98%;       /* near-white */\n\n    --card: 240 26% 8%;              /* ~ #111118 */\n    --card-foreground: 220 20% 98%;\n\n    --popover: 240 26% 8%;\n    --popover-foreground: 220 20% 98%;\n\n    /* --- Brand / actions --- */\n    --primary: 214 100% 60%;         /* electric blue ~ #3A86FF */\n    --primary-foreground: 240 33% 6%;\n\n    --secondary: 240 18% 14%;        /* elevated surface */\n    --secondary-foreground: 220 20% 98%;\n\n    --accent: 46 100% 52%;           /* gold ~ #FFBE0B */\n    --accent-foreground: 240 33% 6%;\n\n    --muted: 240 18% 14%;\n    --muted-foreground: 215 16% 70%;\n\n    /* --- Semantic --- */\n    --success: 155 72% 45%;          /* teal-green */\n    --success-foreground: 240 33% 6%;\n    --warning: 36 95% 55%;\n    --warning-foreground: 240 33% 6%;\n    --destructive: 0 78% 54%;\n    --destructive-foreground: 0 0% 98%;\n\n    /* --- Borders / rings --- */\n    --border: 240 16% 18%;\n    --input: 240 16% 18%;\n    --ring: 214 100% 60%;\n\n    /* --- Radius --- */\n    --radius: 0.75rem;              /* premium rounding */\n\n    /* --- Shadows (premium depth) --- */\n    --shadow-elev-1: 0 1px 0 rgba(255,255,255,0.04), 0 10px 24px rgba(0,0,0,0.35);\n    --shadow-elev-2: 0 1px 0 rgba(255,255,255,0.06), 0 18px 48px rgba(0,0,0,0.5);\n\n    /* --- Chart colors (EUR focus) --- */\n    --chart-up: 155 72% 45%;\n    --chart-down: 0 78% 54%;\n    --chart-neutral: 214 100% 60%;\n  }\n}\n\n/* Force dark background at html/body for consistent pages */\nhtml, body {\n  background: hsl(var(--background));\n  color: hsl(var(--foreground));\n}\n",
    "palette_hex": {
      "bg_0": "#0a0a0f",
      "bg_1": "#111118",
      "bg_2": "#151522",
      "stroke": "#26263a",
      "text_primary": "#f3f5ff",
      "text_muted": "#aab0c2",
      "primary_blue": "#3A86FF",
      "accent_gold": "#FFBE0B",
      "success": "#22c58b",
      "danger": "#ef4444"
    },
    "allowed_gradients": {
      "rule": "Gradientes apenas como background decorativo (<=20% viewport), nunca em áreas de leitura.",
      "hero_overlay": "radial-gradient(900px circle at 20% 10%, rgba(58,134,255,0.18), transparent 60%), radial-gradient(700px circle at 85% 25%, rgba(255,190,11,0.10), transparent 55%)",
      "admin_header_sheen": "linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02), rgba(255,255,255,0.06))"
    },
    "texture": {
      "noise_overlay_css": ".noise-overlay{position:absolute;inset:0;pointer-events:none;background-image:url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"180\" height=\"180\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"180\" height=\"180\" filter=\"url(%23n)\" opacity=\"0.10\"/></svg>');mix-blend-mode:overlay;opacity:.45;}",
      "usage": "Somente em backgrounds de página/hero (não dentro de cards com texto)."
    }
  },

  "typography": {
    "font_pairing": {
      "headings": "Space Grotesk (600-700)",
      "body_ui": "Manrope (400-600)",
      "numbers_optional": "Tabular numerals via font-variant-numeric: tabular-nums"
    },
    "google_fonts_import": "/* index.css */\n@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');\n\n:root{\n  --font-heading: 'Space Grotesk', ui-sans-serif, system-ui;\n  --font-body: 'Manrope', ui-sans-serif, system-ui;\n}\nbody{ font-family: var(--font-body); }\nh1,h2,h3{ font-family: var(--font-heading); letter-spacing: -0.02em; }\n.numeric{ font-variant-numeric: tabular-nums; }\n",
    "scale": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-semibold",
      "h2": "text-base md:text-lg font-medium text-muted-foreground",
      "section_title": "text-lg font-semibold",
      "body": "text-sm md:text-base",
      "caption": "text-xs text-muted-foreground"
    },
    "pt_microcopy_examples": {
      "deposit_security": "Pagamento protegido. Os seus dados são encriptados e tratados com segurança.",
      "withdrawal_sepa": "Transferência SEPA (IBAN) — prazos típicos 1–2 dias úteis.",
      "admin_notice": "Ações no saldo são registadas e auditáveis."
    }
  },

  "grid_and_layout": {
    "breakpoints": {
      "mobile": "<640px",
      "tablet": "640–1024px",
      "desktop": ">=1024px"
    },
    "client_shell": {
      "structure": "Sidebar (icon+label) + Topbar (saldo, P/L, ações) + Content.",
      "sidebar_width": "w-[280px] (desktop), sheet/drawer (mobile)",
      "content_max_width": "max-w-[1400px] mx-auto",
      "padding": "px-4 sm:px-6 lg:px-8 py-5",
      "trade_page_grid": "Desktop: grid-cols-[1.55fr_0.45fr] gap-6; Mobile: single column (chart first)."
    },
    "admin_shell": {
      "structure": "Sidebar compacta + Topbar com search + content full width.",
      "tables": "Sticky header, zebra subtle via bg-muted/20, row hover highlight com border/10."
    }
  },

  "components": {
    "component_path": {
      "navigation": [
        "/app/frontend/src/components/ui/sheet.jsx",
        "/app/frontend/src/components/ui/navigation-menu.jsx",
        "/app/frontend/src/components/ui/breadcrumb.jsx",
        "/app/frontend/src/components/ui/separator.jsx"
      ],
      "forms": [
        "/app/frontend/src/components/ui/form.jsx",
        "/app/frontend/src/components/ui/input.jsx",
        "/app/frontend/src/components/ui/label.jsx",
        "/app/frontend/src/components/ui/select.jsx",
        "/app/frontend/src/components/ui/checkbox.jsx",
        "/app/frontend/src/components/ui/textarea.jsx",
        "/app/frontend/src/components/ui/input-otp.jsx"
      ],
      "feedback": [
        "/app/frontend/src/components/ui/sonner.jsx",
        "/app/frontend/src/components/ui/progress.jsx",
        "/app/frontend/src/components/ui/skeleton.jsx",
        "/app/frontend/src/components/ui/tooltip.jsx"
      ],
      "data_display": [
        "/app/frontend/src/components/ui/card.jsx",
        "/app/frontend/src/components/ui/badge.jsx",
        "/app/frontend/src/components/ui/table.jsx",
        "/app/frontend/src/components/ui/tabs.jsx",
        "/app/frontend/src/components/ui/scroll-area.jsx",
        "/app/frontend/src/components/ui/hover-card.jsx"
      ],
      "overlays": [
        "/app/frontend/src/components/ui/dialog.jsx",
        "/app/frontend/src/components/ui/drawer.jsx",
        "/app/frontend/src/components/ui/alert-dialog.jsx",
        "/app/frontend/src/components/ui/popover.jsx",
        "/app/frontend/src/components/ui/dropdown-menu.jsx"
      ]
    },

    "client_area_pages": {
      "/login": {
        "layout": "Split-screen (desktop): esquerda = mensagem de confiança + highlights; direita = card de login. Mobile = card central com header.",
        "must_include": [
          "CTA primário (Entrar)",
          "Link para /register",
          "Aviso de segurança (microcopy)",
          "Botão 'Esqueci-me da palavra-passe' (se existir)"
        ],
        "ui": {
          "card_class": "bg-card/90 border border-border/70 shadow-[var(--shadow-elev-1)] backdrop-blur-sm",
          "bg_class": "relative min-h-screen bg-background overflow-hidden",
          "decor": "hero_overlay + noise-overlay (<=20% viewport)"
        },
        "data_testids": [
          "login-email-input",
          "login-password-input",
          "login-submit-button",
          "login-register-link"
        ]
      },

      "/register": {
        "layout": "Como /login, mas com progress stepper discreto (1/2) e termos.",
        "ui": {
          "terms": "checkbox + link (Termos e Condições)"
        },
        "data_testids": [
          "register-name-input",
          "register-email-input",
          "register-password-input",
          "register-submit-button"
        ]
      },

      "/app/trade": {
        "layout": "Chart acima da dobra (70% height). Painel lateral com: saldo, P/L, ações rápidas (Depositar, Levantar) e notícias rápidas.",
        "primary_feature": "TradingView EUR/USD",
        "ui": {
          "chart_container": "rounded-xl border border-border/70 bg-card shadow-[var(--shadow-elev-1)] overflow-hidden",
          "right_panel": "space-y-4",
          "quick_actions": "2 botões: Primary (Depositar) + Secondary (Levantar)"
        },
        "micro_interactions": [
          "Hover em cards: border muda para primary/30 + leve brilho",
          "Ao trocar timeframe: transição de opacidade (não use transition: all)"
        ],
        "data_testids": [
          "trade-tradingview-container",
          "trade-balance-eur",
          "trade-profit-eur",
          "trade-deposit-cta",
          "trade-withdrawal-cta"
        ]
      },

      "/app/deposit": {
        "layout": "Form de pagamento estilo gateway. Coluna principal = formulário; coluna lateral = resumo + avisos de segurança.",
        "form_fields": [
          "Nome completo",
          "Número do cartão",
          "Validade (MM/AA)",
          "CVV",
          "País",
          "Código postal",
          "Montante (EUR)"
        ],
        "ui": {
          "secure_header": "ícone cadeado + 'Pagamento Seguro'",
          "field_grouping": "Cartão (número/validade/cvv) agrupados em grid",
          "processing_state": "Progress + texto 'A processar pagamento…' + disabled buttons"
        },
        "data_testids": [
          "deposit-amount-input",
          "deposit-cardholder-input",
          "deposit-card-number-input",
          "deposit-expiry-input",
          "deposit-cvv-input",
          "deposit-country-select",
          "deposit-postal-code-input",
          "deposit-submit-button",
          "deposit-processing-indicator"
        ]
      },

      "/app/withdrawal": {
        "layout": "Tabs: 'Transferência SEPA' e 'Chargeback Cartão'.",
        "ui": {
          "sepa_tab": "Form com IBAN, Nome beneficiário, Montante, Nota opcional",
          "chargeback_tab": "Checklist + instruções + botão 'Iniciar pedido'"
        },
        "data_testids": [
          "withdrawal-method-tabs",
          "withdrawal-sepa-submit-button",
          "withdrawal-chargeback-submit-button"
        ]
      },

      "/app/news": {
        "layout": "Lista de artigos com filtros (FX, Macro, Ações) + search. Skeleton loading.",
        "ui": {
          "news_card": "Card com título, fonte, hora, tags e snippet",
          "empty_state": "Mensagem + botão 'Atualizar'"
        },
        "data_testids": [
          "news-search-input",
          "news-filter-tabs",
          "news-article-list"
        ]
      },

      "/app/profile": {
        "layout": "Dois cards: Dados da conta e Segurança. Botões para atualizar.",
        "ui": {
          "security": "2FA placeholder + trocar password dialog",
          "danger_zone": "Encerrar conta (destructive) em alert-dialog"
        },
        "data_testids": [
          "profile-name",
          "profile-email",
          "profile-save-button",
          "profile-change-password-button"
        ]
      }
    },

    "admin_area_pages": {
      "/adm/login": {
        "layout": "Card compacto + banner de segurança. Visual mais 'internal tool'.",
        "data_testids": [
          "admin-login-username-input",
          "admin-login-password-input",
          "admin-login-submit-button"
        ]
      },
      "/adm": {
        "layout": "Tabela de leads com toolbar (search, filtros status, data range). Drawer/Sheet para detalhes do lead.",
        "table_columns": [
          "Nome",
          "Email",
          "Telefone",
          "País",
          "Status",
          "Saldo (EUR)",
          "P/L (EUR)",
          "Última atividade",
          "Ações"
        ],
        "ui": {
          "status_badges": "Pills (badge) com cores sem saturar: Novo, Contactado, KYC, Depositou, VIP, Bloqueado",
          "row_actions": "DropdownMenu: Ver, Editar saldo, Notas, Bloquear",
          "inline_edit": "Dialog para editar saldo/profit com validação"
        },
        "real_time": {
          "toasts": "Sonner: toast com título + descrição + ação 'Abrir lead'",
          "sound": "Som curto (wav/mp3) em eventos críticos; respeitar prefers-reduced-motion + permitir mute"
        },
        "data_testids": [
          "admin-leads-search-input",
          "admin-leads-table",
          "admin-lead-row",
          "admin-lead-status-button",
          "admin-edit-balance-button"
        ]
      },
      "/adm/cards": {
        "layout": "Tabela de cartões capturados. Acesso restrito. Filtros por país/lead.",
        "ui": {
          "security_banner": "Alert component com aviso de compliance",
          "table_density": "Mais compacto que a área cliente"
        },
        "data_testids": [
          "admin-cards-table",
          "admin-cards-search-input"
        ]
      }
    }
  },

  "buttons_and_controls": {
    "button_style": {
      "shape": "Rounded premium (8–12px) — usar --radius ~ 0.75rem",
      "variants": {
        "primary": "bg-primary text-primary-foreground shadow hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring",
        "secondary": "bg-secondary text-secondary-foreground border border-border/70 hover:bg-secondary/80",
        "ghost": "bg-transparent hover:bg-white/5 border border-transparent hover:border-border/50"
      },
      "motion": "hover translateY(-1px) + shadow leve; active scale(0.98). Evitar transition: all; usar transition-colors + transition-shadow."
    },
    "inputs": {
      "style": "bg-card/60 border-border/70 focus:ring-ring placeholder:text-muted-foreground",
      "help_text": "Sempre que houver risco (cartão), adicionar descrição pequena abaixo do campo."
    },
    "status_pills": {
      "classes": {
        "new": "bg-primary/15 text-primary border border-primary/25",
        "kyc": "bg-accent/15 text-accent border border-accent/25",
        "vip": "bg-white/8 text-foreground border border-white/10",
        "blocked": "bg-destructive/15 text-destructive border border-destructive/25",
        "success": "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
      }
    }
  },

  "motion_and_microinteractions": {
    "library": {
      "name": "framer-motion",
      "install": "npm i framer-motion",
      "usage": [
        "page transitions (fade+slide 6–10px)",
        "table row highlight on update (admin)",
        "drawer/sheet entrances"
      ]
    },
    "principles": [
      "Duration 160–220ms para hover; 260–360ms para overlays",
      "Easing: cubic-bezier(0.2, 0.8, 0.2, 1)",
      "Respeitar prefers-reduced-motion: desativar parallax/entradas"
    ],
    "admin_realtime": [
      "Quando um lead muda: animar background flash (primary/8) por 600ms",
      "Toast com som: throttle para evitar spam; botão 'Silenciar' no header"
    ]
  },

  "data_viz": {
    "tradingview": {
      "prominence": "EUR/USD deve dominar /app/trade acima da dobra",
      "container": "Card com header mínimo (ticker, spread, timeframe tabs) e corpo do widget",
      "colors": "Up=--chart-up, Down=--chart-down, grid=white/6, labels=muted"
    },
    "charts_optional": {
      "library": "recharts",
      "install": "npm i recharts",
      "use_cases": [
        "mini chart de equity (saldo) no painel lateral",
        "admin: deposits por dia (7/30 dias)"
      ],
      "empty_state": "Mostrar skeleton primeiro; depois ‘Sem dados para o período selecionado’."
    }
  },

  "accessibility": {
    "requirements": [
      "Contraste WCAG AA (texto muted ainda legível sobre bg)",
      "Focus ring visível (ring azul) em todos os inputs/botões",
      "Tabelas: header sticky + aria-label em ações",
      "Teclado: navegação em menus, dialogs, sheets",
      "Admin som: alternativa visual (toast) e toggle mute"
    ],
    "reduced_motion": "Usar prefers-reduced-motion para desligar parallax e reduzir animações"
  },

  "images": {
    "image_urls": [
      {
        "category": "background/hero-decor",
        "description": "Textura abstrata azul/teal para overlays discretos em /login e /register (usar com opacidade baixa + mask).",
        "url": "https://images.unsplash.com/photo-1601820134448-12a7a4d0b1c9?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85"
      },
      {
        "category": "background/pattern",
        "description": "Padrão/mesh para área de trade ou admin header (aplicar blur + opacity 0.06–0.10).",
        "url": "https://images.unsplash.com/photo-1651499833046-a21523397971?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85"
      },
      {
        "category": "decor/finance-abstract",
        "description": "Imagem abstrata para placeholders (sem mostrar rostos). Usar apenas como detalhe lateral (<=20% viewport).",
        "url": "https://images.unsplash.com/photo-1544185196-bd8bcb3bcca4?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85"
      }
    ]
  },

  "implementation_notes": {
    "instructions_to_main_agent": [
      "Atualizar /app/frontend/src/index.css: substituir tokens padrão do shadcn para dark-only usando tokens_css acima; aplicar fontes Google.",
      "Remover/ignorar estilos do CRA em App.css (App-header centralizado etc). Não aplicar text-align: center no container.",
      "Garantir sidebar + topbar como layout padrão nas rotas /app/* e /adm/*.",
      "Usar componentes shadcn existentes em /components/ui (JS, não TSX).",
      "Todos os botões/inputs/links/tabs/rows e indicadores críticos precisam de data-testid em kebab-case.",
      "Não usar transition: all. Em botões: transition-colors, transition-shadow; em cards: transition-colors.",
      "Admin: implementar Sonner toasts + som com mute toggle; throttle para eventos frequentes.",
      "Deposit: construir UI de pagamento ‘gateway’ com agrupamento de campos e mensagens de segurança; processamento com Progress + disabled state.",
      "Usar TradingView widget embebido em container premium (rounded-xl, border-border/70, shadow)."
    ],
    "data_testid_convention": {
      "rule": "kebab-case descrevendo função",
      "examples": [
        "trade-deposit-cta",
        "admin-leads-table",
        "deposit-processing-indicator",
        "withdrawal-sepa-submit-button"
      ]
    }
  },

  "General UI UX Design Guidelines": "- You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals."
}
