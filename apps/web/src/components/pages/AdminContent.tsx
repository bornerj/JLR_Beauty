import { useState } from "react";
import { getUser } from "../../lib/auth";
import { useBranding } from "../../modules/public-site/branding.runtime";
import { Link } from "react-router-dom";

const adminShellInlineCss = ".admin-shell {\r\n            background: #f3efe0;\r\n        }\r\n        .admin-sidebar {\r\n            background: #f3efe0;\r\n            border-color: #d4af37;\r\n        }\r\n        .admin-main {\r\n            background: #f3efe0;\r\n            color: #1b2f24;\r\n        }\r\n        .admin-main h1,\r\n        .admin-main h2,\r\n        .admin-main h3,\r\n        .admin-main h4 {\r\n            color: #1b2f24;\r\n        }\r\n        .admin-main .text-stone-500,\r\n        .admin-main .text-stone-600,\r\n        .admin-main .text-stone-400,\r\n        .admin-main .text-stone-300,\r\n        .admin-main .text-gray-500,\r\n        .admin-main .text-gray-400,\r\n        .admin-main .text-gray-300,\r\n        .admin-main .text-text-muted {\r\n            color: #4a5f54;\r\n        }\r\n        .admin-main .text-primary,\r\n        .admin-main .text-gold,\r\n        .admin-main .text-gold-accent {\r\n            color: #b58b2a;\r\n        }\r\n        .admin-main .bg-white:not(input):not(select):not(textarea):not(option) {\r\n            background: #fbf7ec !important;\r\n        }\r\n        .admin-main .bg-\\[\\#f6f8f6\\]:not(input):not(select):not(textarea):not(option) {\r\n            background: #f7f1e2 !important;\r\n        }\r\n        .admin-main input.bg-\\[\\#f6f8f6\\],\r\n        .admin-main select.bg-\\[\\#f6f8f6\\],\r\n        .admin-main textarea.bg-\\[\\#f6f8f6\\] {\r\n            background: #f8f2e6 !important;\r\n        }\r\n        .admin-main .hover\\:bg-\\[\\#f6f8f6\\]:hover {\r\n            background: #efe6d0 !important;\r\n        }\r\n        .admin-main .hover\\:bg-white:hover {\r\n            background: #efe6d0 !important;\r\n        }\r\n        .admin-main .overflow-hidden > div[class*=\"border-b\"] {\r\n            background: #198754 !important;\r\n            border-color: #d4af37 !important;\r\n        }\r\n        .admin-main .overflow-hidden > div[class*=\"border-b\"] .text-text-muted,\r\n        .admin-main .overflow-hidden > div[class*=\"border-b\"] [data-services-pagination-range] {\r\n            color: #ffffff !important;\r\n        }\r\n        .admin-main .overflow-hidden > div[class*=\"border-b\"] button,\r\n        .admin-main .overflow-hidden > div[class*=\"border-b\"] [data-services-pagination-page] {\r\n            background: #1b2f24 !important;\r\n            color: #d4af37 !important;\r\n            border-color: #d4af37 !important;\r\n        }\r\n        .admin-main table thead {\r\n            background: #efe6d0 !important;\r\n        }\r\n        .admin-main table thead th {\r\n            color: #1b2f24 !important;\r\n            font-weight: 700;\r\n        }\r\n        .admin-main .table-head-cell {\r\n            font-size: 0.72rem;\r\n            letter-spacing: 0.08em;\r\n            line-height: 1.15;\r\n            padding-top: 0.72rem;\r\n            padding-bottom: 0.72rem;\r\n        }\r\n        .admin-main .table-cell {\r\n            padding-top: 0.68rem;\r\n            padding-bottom: 0.68rem;\r\n            line-height: 1.35;\r\n        }\r\n        .admin-main .product-description-head,\r\n        .admin-main .product-description-cell {\r\n            width: 140px;\r\n            min-width: 140px;\r\n            max-width: 140px;\r\n        }\r\n        .admin-main .product-description-text {\r\n            display: -webkit-box;\r\n            -webkit-box-orient: vertical;\r\n            -webkit-line-clamp: 2;\r\n            overflow: hidden;\r\n            white-space: normal;\r\n            word-break: break-word;\r\n            line-height: 1.2;\r\n            max-height: 2.4em;\r\n        }\r\n        .admin-main .admin-grid-toolbar {\r\n            border-bottom-width: 1px;\r\n        }\r\n        .admin-main .admin-grid-toolbar [data-users-pagination-range],\r\n        .admin-main .admin-grid-toolbar [data-people-customers-range],\r\n        .admin-main .admin-grid-toolbar [data-people-professionals-range],\r\n        .admin-main .admin-grid-toolbar [data-services-pagination-range],\r\n        .admin-main .admin-grid-toolbar [data-products-pagination-range],\r\n        .admin-main .admin-grid-toolbar [data-subscriptions-pagination-range],\r\n        .admin-main .admin-grid-toolbar [data-leads-pagination-range],\r\n        .admin-main .admin-grid-toolbar [data-orders-pagination-range] {\r\n            font-size: 0.72rem;\r\n            line-height: 1.2;\r\n            letter-spacing: 0.08em;\r\n            font-weight: 700;\r\n        }\r\n        .admin-main [data-users-page-size],\r\n        .admin-main [data-people-customers-page-size],\r\n        .admin-main [data-people-professionals-page-size],\r\n        .admin-main [data-services-page-size],\r\n        .admin-main [data-products-page-size],\r\n        .admin-main [data-subscriptions-page-size],\r\n        .admin-main [data-leads-page-size],\r\n        .admin-main [data-orders-page-size] {\r\n            min-width: 4.75rem;\r\n            min-height: 2.2rem;\r\n            font-weight: 600;\r\n        }\r\n        .admin-main [data-users-pagination-page],\r\n        .admin-main [data-people-customers-pagination-page],\r\n        .admin-main [data-people-professionals-pagination-page],\r\n        .admin-main [data-services-pagination-page],\r\n        .admin-main [data-products-pagination-page],\r\n        .admin-main [data-subscriptions-pagination-page],\r\n        .admin-main [data-leads-pagination-page],\r\n        .admin-main [data-orders-pagination-page] {\r\n            min-width: 7.25rem;\r\n            min-height: 2.2rem;\r\n            display: inline-flex;\r\n            align-items: center;\r\n            justify-content: center;\r\n            text-align: center;\r\n            white-space: nowrap;\r\n        }\r\n        .admin-main [data-users-page-first],\r\n        .admin-main [data-users-page-prev],\r\n        .admin-main [data-users-page-next],\r\n        .admin-main [data-users-page-last],\r\n        .admin-main [data-people-customers-page-first],\r\n        .admin-main [data-people-customers-page-prev],\r\n        .admin-main [data-people-customers-page-next],\r\n        .admin-main [data-people-customers-page-last],\r\n        .admin-main [data-people-professionals-page-first],\r\n        .admin-main [data-people-professionals-page-prev],\r\n        .admin-main [data-people-professionals-page-next],\r\n        .admin-main [data-people-professionals-page-last],\r\n        .admin-main [data-services-page-first],\r\n        .admin-main [data-services-page-prev],\r\n        .admin-main [data-services-page-next],\r\n        .admin-main [data-services-page-last],\r\n        .admin-main [data-products-page-first],\r\n        .admin-main [data-products-page-prev],\r\n        .admin-main [data-products-page-next],\r\n        .admin-main [data-products-page-last],\r\n        .admin-main [data-subscriptions-page-first],\r\n        .admin-main [data-subscriptions-page-prev],\r\n        .admin-main [data-subscriptions-page-next],\r\n        .admin-main [data-subscriptions-page-last],\r\n        .admin-main [data-leads-page-first],\r\n        .admin-main [data-leads-page-prev],\r\n        .admin-main [data-leads-page-next],\r\n        .admin-main [data-leads-page-last],\r\n        .admin-main [data-orders-page-first],\r\n        .admin-main [data-orders-page-prev],\r\n        .admin-main [data-orders-page-next],\r\n        .admin-main [data-orders-page-last] {\r\n            min-height: 2.2rem;\r\n            min-width: 5.25rem;\r\n            display: inline-flex;\r\n            align-items: center;\r\n            justify-content: center;\r\n            gap: 0.35rem;\r\n            white-space: nowrap;\r\n            font-size: 0.72rem;\r\n        }\r\n        .admin-main [data-users-grid-scroll],\r\n        .admin-main .overflow-x-auto {\r\n            scrollbar-width: thin;\r\n            scrollbar-color: #b58b2a #efe6d0;\r\n        }\r\n        @media (max-width: 900px) {\r\n            .admin-main .admin-grid-toolbar {\r\n                padding: 0.8rem 0.9rem !important;\r\n                gap: 0.65rem !important;\r\n            }\r\n            .admin-main .admin-grid-toolbar-controls {\r\n                width: 100%;\r\n            }\r\n            .admin-main .admin-grid-toolbar-controls .flex.items-center.gap-2 {\r\n                flex-wrap: wrap;\r\n            }\r\n            .admin-main [data-users-page-first],\r\n            .admin-main [data-people-customers-page-first],\r\n            .admin-main [data-people-professionals-page-first],\r\n            .admin-main [data-services-page-first],\r\n            .admin-main [data-products-page-first],\r\n            .admin-main [data-subscriptions-page-first],\r\n            .admin-main [data-leads-page-first],\r\n            .admin-main [data-orders-page-first],\r\n            .admin-main [data-users-page-last],\r\n            .admin-main [data-people-customers-page-last],\r\n            .admin-main [data-people-professionals-page-last],\r\n            .admin-main [data-services-page-last],\r\n            .admin-main [data-products-page-last],\r\n            .admin-main [data-subscriptions-page-last],\r\n            .admin-main [data-leads-page-last],\r\n            .admin-main [data-orders-page-last] {\r\n                min-width: 2.35rem;\r\n                padding-left: 0.5rem !important;\r\n                padding-right: 0.5rem !important;\r\n                font-size: 0 !important;\r\n            }\r\n            .admin-main [data-users-page-first] .material-symbols-outlined,\r\n            .admin-main [data-people-customers-page-first] .material-symbols-outlined,\r\n            .admin-main [data-people-professionals-page-first] .material-symbols-outlined,\r\n            .admin-main [data-services-page-first] .material-symbols-outlined,\r\n            .admin-main [data-products-page-first] .material-symbols-outlined,\r\n            .admin-main [data-subscriptions-page-first] .material-symbols-outlined,\r\n            .admin-main [data-leads-page-first] .material-symbols-outlined,\r\n            .admin-main [data-orders-page-first] .material-symbols-outlined,\r\n            .admin-main [data-users-page-last] .material-symbols-outlined,\r\n            .admin-main [data-people-customers-page-last] .material-symbols-outlined,\r\n            .admin-main [data-people-professionals-page-last] .material-symbols-outlined,\r\n            .admin-main [data-services-page-last] .material-symbols-outlined,\r\n            .admin-main [data-products-page-last] .material-symbols-outlined,\r\n            .admin-main [data-subscriptions-page-last] .material-symbols-outlined,\r\n            .admin-main [data-leads-page-last] .material-symbols-outlined,\r\n            .admin-main [data-orders-page-last] .material-symbols-outlined {\r\n                font-size: 1rem !important;\r\n                margin: 0;\r\n            }\r\n            .admin-main [data-users-pagination-page],\r\n            .admin-main [data-people-customers-pagination-page],\r\n            .admin-main [data-people-professionals-pagination-page],\r\n            .admin-main [data-services-pagination-page],\r\n            .admin-main [data-products-pagination-page],\r\n            .admin-main [data-subscriptions-pagination-page],\r\n            .admin-main [data-leads-pagination-page],\r\n            .admin-main [data-orders-pagination-page] {\r\n                min-width: 6.2rem;\r\n                font-size: 0.68rem;\r\n            }\r\n        }\r\n        .admin-main .border-[#cfe7d1],\r\n        .admin-main .border-border-color,\r\n        .admin-main .border-stone-100 {\r\n            border-color: #d4af37;\r\n        }\r\n        .admin-main .max-w-\\[1400px\\] {\r\n            display: flex;\r\n            flex-direction: column;\r\n            gap: 3rem;\r\n        }\r\n        .admin-main [data-view=\"dashboard\"] .max-w-\\[1400px\\] > * + * {\r\n            margin-top: 3rem;\r\n        }\r\n        .admin-main [data-view=\"dashboard\"] h2.display-hero {\r\n            color: #1b2f24;\r\n        }\r\n        .admin-main [data-view=\"dashboard\"] p.text-stone-500 {\r\n            color: #4a5f54;\r\n        }\r\n        .admin-sidebar .text-forest-light {\r\n            color: #1b2f24;\r\n        }\r\n        .admin-sidebar .sidebar-label,\r\n        .admin-sidebar .sidebar-text,\r\n        .admin-sidebar .sidebar-text span {\r\n            color: #1b2f24;\r\n        }\r\n        .admin-sidebar .material-symbols-outlined {\r\n            color: #1b2f24;\r\n        }\r\n        .admin-sidebar .sidebar-item {\r\n            border-color: #d4af37;\r\n        }\r\n        .admin-main .max-w-\\[1400px\\] > * {\r\n            margin-bottom: 1.5rem;\r\n        }\r\n        .admin-main .max-w-\\[1400px\\] > *:last-child {\r\n            margin-bottom: 0;\r\n        }\r\n        .admin-topbar {\r\n            display: flex;\r\n            align-items: center;\r\n            justify-content: space-between;\r\n            gap: 1rem;\r\n            background: #f3efe0;\r\n            border-bottom: 1px solid #d4af37;\r\n            padding: 0.75rem 1.5rem;\r\n            position: sticky;\r\n            top: 0;\r\n            z-index: 30;\r\n        }\r\n        .admin-brand {\r\n            display: flex;\r\n            align-items: center;\r\n            gap: 0.9rem;\r\n            text-decoration: none;\r\n        }\r\n        .admin-brand img {\r\n            height: 48px;\r\n            width: auto;\r\n        }\r\n        .admin-brand-mark {\r\n            border: 1px solid #d4af37;\r\n            padding: 0.25rem 0.6rem;\r\n            display: flex;\r\n            flex-direction: column;\r\n            text-transform: uppercase;\r\n            letter-spacing: 0.12em;\r\n            font-weight: 600;\r\n            font-size: 0.85rem;\r\n            color: #1b2f24;\r\n        }\r\n        .admin-brand-mark span:last-child {\r\n            color: #b58b2a;\r\n        }\r\n        .admin-back-link {\r\n            text-decoration: none;\r\n            font-size: 0.75rem;\r\n            font-weight: 700;\r\n            letter-spacing: 0.18em;\r\n            text-transform: uppercase;\r\n            color: #1b2f24;\r\n            border: 1px solid #d4af37;\r\n            padding: 0.5rem 0.9rem;\r\n            border-radius: 999px;\r\n            transition: background 0.2s ease, color 0.2s ease;\r\n        }\r\n        .admin-back-link:hover {\r\n            background: #d4af37;\r\n            color: #1b2f24;\r\n        }\r\n        @media (max-width: 1023px) {\r\n            .admin-sidebar {\r\n                position: sticky;\r\n                top: 4.1rem;\r\n                padding: 0.35rem 0.45rem !important;\r\n                border-bottom: 1px solid #d4af37;\r\n                box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);\r\n                max-height: 3.9rem !important;\r\n                min-height: 3.9rem !important;\r\n                overflow: hidden !important;\r\n                z-index: 25;\r\n            }\r\n            .admin-sidebar > .flex.flex-col.gap-4,\r\n            .admin-sidebar > .flex.flex-col.gap-10 {\r\n                gap: 0 !important;\r\n            }\r\n            .admin-sidebar nav {\r\n                display: flex;\r\n                gap: 0 !important;\r\n                overflow-x: auto !important;\r\n                overflow-y: hidden !important;\r\n                padding-bottom: 0.1rem;\r\n                scrollbar-width: thin;\r\n            }\r\n            .admin-sidebar nav > .flex.flex-col.gap-1 {\r\n                display: flex;\r\n                flex-direction: row !important;\r\n                align-items: center;\r\n                gap: 0.4rem !important;\r\n            }\r\n            .admin-sidebar .sidebar-label,\r\n            .admin-sidebar .sidebar-text,\r\n            .admin-sidebar .sidebar-meta {\r\n                display: none !important;\r\n            }\r\n            .admin-sidebar .sidebar-item {\r\n                min-width: 2.45rem;\r\n                min-height: 2.45rem;\r\n                padding: 0.2rem !important;\r\n                justify-content: center;\r\n                border-radius: 0.7rem;\r\n                flex: 0 0 auto;\r\n            }\r\n            .admin-main {\r\n                padding-left: 0 !important;\r\n            }\r\n        }\r\n        @media (min-width: 1024px) {\r\n            .admin-sidebar {\r\n                position: absolute;\r\n                top: 6rem;\r\n                left: 1.5rem;\r\n                height: calc(100vh - 7rem);\r\n                max-height: calc(100vh - 7rem);\r\n                width: 4.5rem;\r\n                border-radius: 1rem;\r\n                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);\r\n                transition: width 0.25s ease;\r\n                overflow-x: hidden;\r\n                overflow-y: auto;\r\n            }\r\n            .admin-sidebar:hover {\r\n                width: 18rem;\r\n            }\r\n            .admin-main {\r\n                padding-left: 6rem;\r\n            }\r\n            .admin-sidebar .sidebar-text {\r\n                opacity: 0;\r\n                transform: translateX(6px);\r\n                pointer-events: none;\r\n                transition: opacity 0.2s ease, transform 0.2s ease;\r\n            }\r\n            .admin-sidebar:hover .sidebar-text {\r\n                opacity: 1;\r\n                transform: translateX(0);\r\n                pointer-events: auto;\r\n            }\r\n            .admin-sidebar .sidebar-meta {\r\n                opacity: 0;\r\n                transform: translateX(6px);\r\n                pointer-events: none;\r\n                transition: opacity 0.2s ease, transform 0.2s ease;\r\n            }\r\n            .admin-sidebar:hover .sidebar-meta {\r\n                opacity: 0.6;\r\n                transform: translateX(0);\r\n                pointer-events: auto;\r\n            }\r\n        }";

export default function AdminContent() {
  const branding = useBranding();
  const [isMasterMenuOpen, setIsMasterMenuOpen] = useState<boolean>(false);
  const currentUser = getUser();
  const isMaster = currentUser?.role?.trim().toUpperCase() === "MASTER";

  return (
    <>
      <style>{adminShellInlineCss}</style>
    
    <header className="admin-topbar">
        <Link className="admin-brand" to="/">
            <img alt={branding.fullName} src={branding.logoUrl} />
        </Link>
        <Link className="admin-back-link" to="/">Voltar ao site</Link>
    </header>
    <div className="admin-shell flex flex-col lg:flex-row min-h-screen w-full relative pt-0">
        {/* Sidebar */} 
        <aside className="admin-sidebar group w-full flex-shrink-0 bg-white dark:bg-[#0c1a0e] border-b lg:border-b-0 lg:border-r border-[#cfe7d1]/50 p-2.5 lg:p-6 flex flex-col gap-4 lg:gap-8 justify-start relative z-20 shadow-sm lg:shadow-none">
            <div className="flex flex-col gap-4 lg:gap-10">
                <nav className="flex flex-col gap-3 lg:gap-6">
                    <div className="flex flex-col gap-1">
                        <p className="sidebar-label text-forest-light sidebar-text">Destaque</p>
                        <button type="button" className="sidebar-item sidebar-item--active group" data-view-trigger="dashboard">
                            <span className="material-symbols-outlined text-primary text-xl">dashboard</span>
                            <div className="flex flex-col sidebar-text">
                                <span className="text-forest-dark dark:text-white text-base font-semibold leading-none">Painel</span>
                                <span className="text-primary text-xs mt-1 font-medium">Ativo</span>
                            </div>
                        </button>
                        <button type="button" className="sidebar-item sidebar-item--inactive group" data-view-trigger="agenda">
                            <span className="material-symbols-outlined text-forest-light text-xl">calendar_month</span>
                            <div className="flex flex-col sidebar-text">
                                <span className="text-forest-dark dark:text-gray-300 text-base font-medium leading-none">Agenda</span>
                            </div>
                        </button>
                        <button type="button" className="sidebar-item sidebar-item--inactive group" data-view-trigger="whatsapp-contatos">
                            <span className="material-symbols-outlined text-forest-light text-xl">chat</span>
                            <div className="flex flex-col sidebar-text">
                                <span className="text-forest-dark dark:text-gray-300 text-base font-medium leading-none">WhatsApp</span>
                            </div>
                        </button>
                        <button type="button" className="sidebar-item sidebar-item--inactive group" data-view-trigger="vendas">
                            <span className="material-symbols-outlined text-forest-light text-xl">payments</span>
                            <div className="flex flex-col sidebar-text">
                                <span className="text-forest-dark dark:text-gray-300 text-base font-medium leading-none">Vendas</span>
                            </div>
                        </button>
                        <button type="button" className="sidebar-item sidebar-item--inactive group" data-view-trigger="checkout-entrega">
                            <span className="material-symbols-outlined text-forest-light text-xl">local_shipping</span>
                            <div className="flex flex-col sidebar-text">
                                <span className="text-forest-dark dark:text-gray-300 text-base font-medium leading-none">Entrega</span>
                            </div>
                        </button>
                        <button type="button" className="sidebar-item sidebar-item--inactive group" data-view-trigger="produtos">
                            <span className="material-symbols-outlined text-forest-light text-xl">inventory_2</span>
                            <div className="flex flex-col sidebar-text">
                                <span className="text-forest-dark dark:text-gray-300 text-base font-medium leading-none">Produtos</span>
                            </div>
                        </button>
                        <button type="button" className="sidebar-item sidebar-item--inactive group" data-view-trigger="cupons-desconto">
                            <span className="material-symbols-outlined text-forest-light text-xl">local_offer</span>
                            <div className="flex flex-col sidebar-text">
                                <span className="text-forest-dark dark:text-gray-300 text-base font-medium leading-none">Cupons</span>
                            </div>
                        </button>
                        <button type="button" className="sidebar-item sidebar-item--inactive group" data-view-trigger="metas">
                            <span className="material-symbols-outlined text-forest-light text-xl">groups</span>
                            <div className="flex flex-col sidebar-text">
                                <span className="text-forest-dark dark:text-gray-300 text-base font-medium leading-none">Equipes-Metas</span>
                            </div>
                        </button>
                        <button type="button" className="sidebar-item sidebar-item--inactive group" data-view-trigger="performance">
                            <span className="material-symbols-outlined text-forest-light text-xl">groups</span>
                            <div className="flex flex-col sidebar-text">
                                <span className="text-forest-dark dark:text-gray-300 text-base font-medium leading-none">Equipes-Perform</span>
                            </div>
                        </button>
                        <button type="button" className="sidebar-item sidebar-item--inactive group" data-view-trigger="servicos">
                            <span className="material-symbols-outlined text-forest-light text-xl">content_cut</span>
                            <div className="flex flex-col sidebar-text">
                                <span className="text-forest-dark dark:text-gray-300 text-base font-medium leading-none">Serviços</span>
                            </div>
                        </button>
                        <button type="button" className="sidebar-item sidebar-item--inactive group" data-view-trigger="usuarios">
                            <span className="material-symbols-outlined text-forest-light text-xl">groups</span>
                            <div className="flex flex-col sidebar-text">
                                <span className="text-forest-dark dark:text-gray-300 text-base font-medium leading-none">Pessoas</span>
                            </div>
                        </button>
                        <button type="button" className="sidebar-item sidebar-item--inactive group" data-view-trigger="planos">
                            <span className="material-symbols-outlined text-forest-light text-xl">card_membership</span>
                            <div className="flex flex-col sidebar-text">
                                <span className="text-forest-dark dark:text-gray-300 text-base font-medium leading-none">Planos</span>
                            </div>
                        </button>
                        <button type="button" className="sidebar-item sidebar-item--inactive group" data-view-trigger="assinantes">
                            <span className="material-symbols-outlined text-forest-light text-xl">group</span>
                            <div className="flex flex-col sidebar-text">
                                <span className="text-forest-dark dark:text-gray-300 text-base font-medium leading-none">Assinantes</span>
                            </div>
                        </button>
                        {isMaster ? (
                            <div className="flex flex-col gap-1" data-master-menu>
                                <button
                                    type="button"
                                    className="sidebar-item sidebar-item--inactive group"
                                    data-master-menu-toggle
                                    aria-expanded={isMasterMenuOpen}
                                    onClick={() => setIsMasterMenuOpen((current) => !current)}
                                >
                                    <span className="material-symbols-outlined text-forest-light text-xl">admin_panel_settings</span>
                                    <div className="flex flex-col sidebar-text">
                                        <span className="text-forest-dark dark:text-gray-300 text-base font-medium leading-none">Master</span>
                                    </div>
                                </button>
                                <div className={`flex-col gap-1 pl-4 ${isMasterMenuOpen ? "flex" : "hidden"}`} data-master-submenu>
                                    <button type="button" className="sidebar-item sidebar-item--inactive group" data-view-trigger="branding">
                                        <span className="material-symbols-outlined text-forest-light text-xl">branding_watermark</span>
                                        <div className="flex flex-col sidebar-text">
                                            <span className="text-forest-dark dark:text-gray-300 text-base font-medium leading-none">Branding</span>
                                        </div>
                                    </button>
                                    <button type="button" className="sidebar-item sidebar-item--inactive group" data-view-trigger="site-sections">
                                        <span className="material-symbols-outlined text-forest-light text-xl">toggle_on</span>
                                        <div className="flex flex-col sidebar-text">
                                            <span className="text-forest-dark dark:text-gray-300 text-base font-medium leading-none">Seções SPA</span>
                                        </div>
                                    </button>
                                    <button type="button" className="sidebar-item sidebar-item--inactive group" data-view-trigger="testes">
                                        <span className="material-symbols-outlined text-forest-light text-xl">bug_report</span>
                                        <div className="flex flex-col sidebar-text">
                                            <span className="text-forest-dark dark:text-gray-300 text-base font-medium leading-none">Testes</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        ) : null}
                        <button type="button" className="sidebar-item sidebar-item--inactive group" data-view-trigger="galeria-midias">
                            <span className="material-symbols-outlined text-forest-light text-xl">photo_library</span>
                            <div className="flex flex-col sidebar-text">
                                <span className="text-forest-dark dark:text-gray-300 text-base font-medium leading-none">Galeria</span>
                            </div>
                        </button>
                    </div>
                </nav>
            </div>
            <div className="mt-10 lg:mt-0 flex flex-col gap-3 opacity-60 sidebar-meta">
                <div className="flex items-center gap-2 text-forest-light text-sm">
                    <span className="material-symbols-outlined text-base">help</span>
                    <span>Precisa de ajuda(c)</span>
                </div>
                <p className="text-xs text-forest-light">{`(c) 2023 ${branding.fullName}. Todos os direitos reservados.`}</p>
            </div>
        </aside>
        {/* Main Content Area */}
        <main className="admin-main flex-1 h-full overflow-y-auto relative"><div className="spa-views">
            <section className="view-panel" data-view="dashboard">
              <div data-react-admin-dashboard-view></div>
            </section>
  <section className="view-panel hidden" data-view="usuarios">
    <div data-react-admin-people-view></div>
  </section>
  <section className="view-panel hidden" data-view="servicos">
    <div data-react-admin-services-view></div>
  </section>
  <section className="view-panel hidden" data-view="metas">
    <div data-react-admin-goals-view></div>
  </section>
  <section className="view-panel hidden" data-view="performance">
    <div data-react-admin-performance-view></div>
  </section>
  <section className="view-panel hidden" data-view="produtos">
    <div data-react-admin-products-view></div>
  </section>
  <section className="view-panel hidden" data-view="cupons-desconto">
    <div data-react-admin-discount-coupons-view></div>
  </section>
  <section className="view-panel hidden" data-view="planos">
    <div data-react-admin-plans-view></div>
  </section>

  <section className="view-panel hidden" data-view="assinantes">
    <div data-react-admin-subscribers-view></div>
  </section>

  <div className="fixed inset-0 z-50 hidden items-center justify-center bg-black/40 backdrop-blur-sm" data-modal="assinantes-form" aria-hidden="true">
    <div className="bg-white w-[94vw] max-w-2xl rounded-2xl shadow-2xl border border-[#cfe7d1] p-5 sm:p-6 relative">
        <button className="absolute top-4 right-4 text-forest/60 hover:text-forest transition" type="button" data-close-modal="assinantes-form" aria-label="Fechar">
            <span className="material-symbols-outlined">close</span>
        </button>
        <div className="mb-4">
            <h3 className="text-2xl font-bold text-forest mb-1" data-subscription-modal-title>Incluir assinante</h3>
            <p className="text-sm text-stone-500">Preencha os dados e salve.</p>
        </div>
        <form className="grid grid-cols-1 lg:grid-cols-2 gap-4" data-subscription-form>
            <input type="hidden" data-subscription-id />
            <div className="flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Plano</label>
                <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 pl-3 pr-9 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-xs cursor-pointer hover:bg-white transition-colors" data-subscription-membership-id></select>
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Status</label>
                <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 pl-3 pr-9 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-xs cursor-pointer hover:bg-white transition-colors" data-subscription-status>
                    <option value="PENDENTE">Pendente</option>
                    <option value="ATIVA">Ativa</option>
                    <option value="CANCELADA">Cancelada</option>
                    <option value="INADIMPLENTE">Inadimplente</option>
                </select>
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Nome</label>
                <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-subscription-customer-name />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Email</label>
                <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="email" data-subscription-customer-email />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Telefone</label>
                <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-subscription-customer-phone />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Inicio</label>
                <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="datetime-local" data-subscription-started-at />
            </div>
            <div className="flex flex-col gap-1 lg:col-span-2">
                <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Cancelamento</label>
                <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="datetime-local" data-subscription-cancelled-at />
            </div>
            <div className="lg:col-span-2 mt-2 flex items-center justify-end gap-3">
                <button className="px-4 py-2 rounded-lg border border-[#cfe7d1] text-forest-green hover:bg-[#f6f8f6] transition-colors text-xs" type="button" data-close-modal="assinantes-form">Cancelar</button>
                <button className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-xs" type="submit" data-subscription-save>Salvar</button>
            </div>
        </form>
    </div>
  </div>

  <section className="view-panel hidden" data-view="agenda">
    <div data-react-admin-schedule-view></div>
  </section>

  <section className="view-panel hidden" data-view="whatsapp-contatos">
    <div data-react-admin-whatsapp-contacts-view></div>
  </section>

  <section className="view-panel hidden" data-view="vendas">
    <div data-react-admin-sales-view></div>
  </section>
  <section className="view-panel hidden" data-view="checkout-entrega">
    <div data-react-admin-checkout-delivery-view></div>
  </section>
  {isMaster ? (
    <>
      <section className="view-panel hidden" data-view="testes">
        <div data-react-admin-tests-view></div>
      </section>
      <section className="view-panel hidden" data-view="site-sections">
        <div data-react-admin-section-toggles-view></div>
      </section>
      <section className="view-panel hidden" data-view="branding">
        <div data-react-admin-branding-view></div>
      </section>
    </>
  ) : null}
  <section className="view-panel hidden" data-view="galeria-midias">
    <div data-react-admin-media-gallery-view></div>
  </section>

</div></main>
    </div>

    {/* Modal Categorias */}
    <div className="fixed inset-0 z-50 hidden items-center justify-center bg-black/40 backdrop-blur-sm" data-modal="categorias" data-crud="produtos-categorias" aria-hidden="true">
        <div className="bg-white w-[92%] max-w-xl rounded-2xl border border-[#cfe7d1] shadow-xl p-6 relative text-xs">
            <div className="flex items-center justify-between mb-4 gap-3">
                <div>
                    <h3 className="text-lg font-bold text-forest">Categorias</h3>
                    <p className="text-xs text-text-muted">Cadastre e gerencie categorias do catálogo.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors flex items-center gap-1" type="button">
                        <span className="material-symbols-outlined text-sm">add</span>
                        Nova
                    </button>
                    <button className="h-8 w-8 rounded-full border border-[#cfe7d1] text-forest-green hover:bg-[#f6f8f6] flex items-center justify-center" type="button" data-close-modal="categorias" aria-label="Fechar modal">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            </div>

            <div className="bg-[#f6f8f6] rounded-xl border border-[#e7efe9] p-4 mb-4">
                <form className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Nome</label>
                        <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-white text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs" placeholder="Ex.: Tratamento" type="text" data-input="name" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Status</label>
                        <div className="relative">
                            <select className="appearance-none w-full bg-white border border-[#cfe7d1] text-forest-green py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs cursor-pointer hover:bg-[#f6f8f6] transition-colors" data-input="status">
                                <option value="ACTIVE">Ativo</option>
                                <option value="INACTIVE">Inativo</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                                <span className="material-symbols-outlined text-base">expand_more</span>
                            </div>
                        </div>
                    </div>
                    <div className="sm:col-span-2 flex items-center justify-end gap-2">
                        <button className="px-4 py-2 rounded-lg bg-white border border-[#cfe7d1] text-forest-green text-xs font-semibold hover:bg-[#f6f8f6] transition-colors" type="button" data-clear="produtos-categorias">Limpar</button>
                        <button className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors" type="button" data-save="produtos-categorias">Salvar</button>
                    </div>
                </form>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#cfe7d1]">
                <table className="min-w-full divide-y divide-[#cfe7d1] text-xs">
                    <thead className="bg-[#f6f8f6]">
                        <tr>
                            <th className="table-head-cell text-left text-text-muted">Categoria</th>
                            <th className="table-head-cell text-left text-text-muted">Status</th>
                            <th className="table-head-cell text-right text-text-muted">Acoes</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#f4f0e7]" data-list="produtos-categorias"></tbody>
                </table>
            </div>
        </div>
    </div>

    {/* Modal Status Produtos */}
    <div className="fixed inset-0 z-50 hidden items-center justify-center bg-black/40 backdrop-blur-sm" data-modal="status-produtos" data-crud="produtos-status" aria-hidden="true">
        <div className="bg-white w-[92%] max-w-xl rounded-2xl border border-[#cfe7d1] shadow-xl p-6 relative text-xs">
            <div className="flex items-center justify-between mb-4 gap-3">
                <div>
                    <h3 className="text-lg font-bold text-forest">Status de Produtos</h3>
                    <p className="text-xs text-text-muted">Controle a disponibilidade dos itens do catalogo.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors flex items-center gap-1" type="button">
                        <span className="material-symbols-outlined text-sm">add</span>
                        Novo
                    </button>
                    <button className="h-8 w-8 rounded-full border border-[#cfe7d1] text-forest-green hover:bg-[#f6f8f6] flex items-center justify-center" type="button" data-close-modal="status-produtos" aria-label="Fechar modal">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            </div>

            <div className="bg-[#f6f8f6] rounded-xl border border-[#e7efe9] p-4 mb-4">
                <form className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Nome</label>
                        <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-white text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs" placeholder="Ex.: Ativo" type="text" data-input="name" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Cor do selo</label>
                        <div className="relative">
                            <select className="appearance-none w-full bg-white border border-[#cfe7d1] text-forest-green py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs cursor-pointer hover:bg-[#f6f8f6] transition-colors" data-input="color">
                                <option value="VERDE">Verde</option>
                                <option value="AMARELO">Amarelo</option>
                                <option value="VERMELHO">Vermelho</option>
                                <option value="CINZA">Cinza</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                                <span className="material-symbols-outlined text-base">expand_more</span>
                            </div>
                        </div>
                    </div>
                    <div className="sm:col-span-2 flex items-center justify-end gap-2">
                        <button className="px-4 py-2 rounded-lg bg-white border border-[#cfe7d1] text-forest-green text-xs font-semibold hover:bg-[#f6f8f6] transition-colors" type="button" data-clear="produtos-status">Limpar</button>
                        <button className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors" type="button" data-save="produtos-status">Salvar</button>
                    </div>
                </form>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#cfe7d1]">
                <table className="min-w-full divide-y divide-[#cfe7d1] text-xs">
                    <thead className="bg-[#f6f8f6]">
                        <tr>
                            <th className="table-head-cell text-left text-text-muted">Status</th>
                            <th className="table-head-cell text-left text-text-muted">Selo</th>
                            <th className="table-head-cell text-right text-text-muted">Acoes</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#f4f0e7]" data-list="produtos-status"></tbody>
                </table>
            </div>
        </div>
    </div>

    {/* Modal Categorias Servicos */}
    <div className="fixed inset-0 z-50 hidden items-center justify-center bg-black/40 backdrop-blur-sm" data-modal="categorias-servicos" data-crud="servicos-categorias" aria-hidden="true">
        <div className="bg-[#8EB69B] w-[92%] max-w-xl rounded-2xl border border-[#cfe7d1] shadow-xl p-6 relative text-xs">
            <div className="flex items-center justify-between mb-4 gap-3">
                <div>
                    <h3 className="text-lg font-bold text-forest">Categorias de Servicos</h3>
                    <p className="text-xs text-text-muted">Organize os tipos de atendimento.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors flex items-center gap-1" type="button">
                        <span className="material-symbols-outlined text-sm">add</span>
                        Nova
                    </button>
                    <button className="h-8 w-8 rounded-full border border-[#cfe7d1] text-forest-green hover:bg-[#f6f8f6] flex items-center justify-center" type="button" data-close-modal="categorias-servicos" aria-label="Fechar modal">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            </div>

            <div className="bg-[#f6f8f6] rounded-xl border border-[#e7efe9] p-4 mb-4">
                <form className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Nome</label>
                        <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-white text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs" placeholder="Ex.: Cabelos" type="text" data-input="name" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Status</label>
                        <div className="relative">
                            <select className="appearance-none w-full bg-white border border-[#cfe7d1] text-forest-green py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs cursor-pointer hover:bg-[#f6f8f6] transition-colors" data-input="status">
                                <option value="ACTIVE">Ativo</option>
                                <option value="INACTIVE">Inativo</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                                <span className="material-symbols-outlined text-base">expand_more</span>
                            </div>
                        </div>
                    </div>
                    <div className="sm:col-span-2 flex items-center justify-end gap-2">
                        <button className="px-4 py-2 rounded-lg bg-white border border-[#cfe7d1] text-forest-green text-xs font-semibold hover:bg-[#f6f8f6] transition-colors" type="button" data-clear="servicos-categorias">Limpar</button>
                        <button className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors" type="button" data-save="servicos-categorias">Salvar</button>
                    </div>
                </form>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#cfe7d1]">
                <table className="min-w-full divide-y divide-[#cfe7d1] text-xs">
                    <thead className="bg-[#f6f8f6]">
                        <tr>
                            <th className="table-head-cell text-left text-text-muted">Categoria</th>
                            <th className="table-head-cell text-left text-text-muted">Status</th>
                            <th className="table-head-cell text-right text-text-muted">Acoes</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#f4f0e7]" data-list="servicos-categorias"></tbody>
                </table>
            </div>
        </div>
    </div>

    {/* Modal Status Servicos */}
    <div className="fixed inset-0 z-50 hidden items-center justify-center bg-black/40 backdrop-blur-sm" data-modal="status-servicos" data-crud="servicos-status" aria-hidden="true">
        <div className="bg-[#8EB69B] w-[92%] max-w-xl rounded-2xl border border-[#cfe7d1] shadow-xl p-6 relative text-xs">
            <div className="flex items-center justify-between mb-4 gap-3">
                <div>
                    <h3 className="text-lg font-bold text-forest">Status de Servicos</h3>
                    <p className="text-xs text-text-muted">Defina os estados disponiveis para atendimento.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors flex items-center gap-1" type="button">
                        <span className="material-symbols-outlined text-sm">add</span>
                        Novo
                    </button>
                    <button className="h-8 w-8 rounded-full border border-[#cfe7d1] text-forest-green hover:bg-[#f6f8f6] flex items-center justify-center" type="button" data-close-modal="status-servicos" aria-label="Fechar modal">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            </div>

            <div className="bg-[#f6f8f6] rounded-xl border border-[#e7efe9] p-4 mb-4">
                <form className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Nome</label>
                        <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-white text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs" placeholder="Ex.: Ativo" type="text" data-input="name" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Cor do selo</label>
                        <div className="relative">
                            <select className="appearance-none w-full bg-white border border-[#cfe7d1] text-forest-green py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs cursor-pointer hover:bg-[#f6f8f6] transition-colors" data-input="color">
                                <option value="VERDE">Verde</option>
                                <option value="AMARELO">Amarelo</option>
                                <option value="VERMELHO">Vermelho</option>
                                <option value="CINZA">Cinza</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                                <span className="material-symbols-outlined text-base">expand_more</span>
                            </div>
                        </div>
                    </div>
                    <div className="sm:col-span-2 flex items-center justify-end gap-2">
                        <button className="px-4 py-2 rounded-lg bg-white border border-[#cfe7d1] text-forest-green text-xs font-semibold hover:bg-[#f6f8f6] transition-colors" type="button" data-clear="servicos-status">Limpar</button>
                        <button className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors" type="button" data-save="servicos-status">Salvar</button>
                    </div>
                </form>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#cfe7d1]">
                <table className="min-w-full divide-y divide-[#cfe7d1] text-xs">
                    <thead className="bg-[#f6f8f6]">
                        <tr>
                            <th className="table-head-cell text-left text-text-muted">Status</th>
                            <th className="table-head-cell text-left text-text-muted">Selo</th>
                            <th className="table-head-cell text-right text-text-muted">Acoes</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#f4f0e7]" data-list="servicos-status"></tbody>
                </table>
            </div>
        </div>
    </div>

    {/* Modal Imagem Servico */}
    <div className="fixed inset-0 z-50 hidden items-center justify-center bg-black/40 backdrop-blur-sm" data-modal="servicos-imagem" aria-hidden="true">
        <div className="bg-[#8EB69B] w-[92%] max-w-xl rounded-2xl border border-[#cfe7d1] shadow-xl p-6 relative text-xs">
            <div className="flex items-center justify-between mb-4 gap-3">
                <div>
                    <h3 className="text-lg font-bold text-forest">Imagem do Servico</h3>
                    <p className="text-xs text-text-muted">Escolha uma imagem local ou informe uma URL.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="h-8 w-8 rounded-full border border-[#cfe7d1] text-forest-green hover:bg-[#f6f8f6] flex items-center justify-center" type="button" data-close-modal="servicos-imagem" aria-label="Fechar modal">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            </div>

            <div className="space-y-5">
                <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Selecionar arquivo</label>
                    <input id="servico-imagem-file" className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs" type="file" accept="image/*" />
                </div>
                <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Usar URL</label>
                    <div className="flex items-center gap-2">
                        <input id="servico-imagem-url" className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs" placeholder="https://exemplo.com/imagem.jpg" type="text" />
                        <button id="servico-imagem-use-url" className="h-9 px-4 rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-semibold" type="button">
                            Usar
                        </button>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button id="servico-imagem-clear" className="px-4 py-2 rounded-lg bg-white border border-[#cfe7d1] text-forest-green text-xs font-semibold hover:bg-[#f6f8f6] transition-colors" type="button">
                        Limpar
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors" type="button" data-close-modal="servicos-imagem">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    </div>

    {/* Modal Imagem Produto */}
    <div className="fixed inset-0 z-50 hidden items-center justify-center bg-black/40 backdrop-blur-sm" data-modal="produtos-imagem" aria-hidden="true">
        <div className="bg-white w-[92%] max-w-xl rounded-2xl border border-[#cfe7d1] shadow-xl p-6 relative text-xs">
            <div className="flex items-center justify-between mb-4 gap-3">
                <div>
                    <h3 className="text-lg font-bold text-forest">Imagem do Produto</h3>
                    <p className="text-xs text-text-muted">Escolha uma imagem local ou informe uma URL.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="h-8 w-8 rounded-full border border-[#cfe7d1] text-forest-green hover:bg-[#f6f8f6] flex items-center justify-center" type="button" data-close-modal="produtos-imagem" aria-label="Fechar modal">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            </div>

            <div className="space-y-5">
                <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Selecionar arquivo</label>
                    <input id="produto-imagem-file" className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs" type="file" accept="image/*" />
                </div>
                <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Usar URL</label>
                    <div className="flex items-center gap-2">
                        <input id="produto-imagem-url" className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs" placeholder="https://exemplo.com/imagem.jpg" type="text" />
                        <button id="produto-imagem-use-url" className="h-9 px-4 rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-semibold" type="button">
                            Usar
                        </button>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button id="produto-imagem-clear" className="px-4 py-2 rounded-lg bg-white border border-[#cfe7d1] text-forest-green text-xs font-semibold hover:bg-[#f6f8f6] transition-colors" type="button">
                        Limpar
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors" type="button" data-close-modal="produtos-imagem">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    </div>

    {/* Modal Imagem Usuario */}
    <div className="fixed inset-0 z-50 hidden items-center justify-center bg-black/40 backdrop-blur-sm" data-modal="usuarios-imagem" aria-hidden="true">
        <div className="bg-white w-[92%] max-w-xl rounded-2xl border border-[#cfe7d1] shadow-xl p-6 relative text-xs">
            <div className="flex items-center justify-between mb-4 gap-3">
                <div>
                    <h3 className="text-lg font-bold text-forest">Imagem do Usuario</h3>
                    <p className="text-xs text-text-muted">Escolha uma imagem local ou informe uma URL.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="h-8 w-8 rounded-full border border-[#cfe7d1] text-forest-green hover:bg-[#f6f8f6] flex items-center justify-center" type="button" data-close-modal="usuarios-imagem" aria-label="Fechar modal">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            </div>

            <div className="space-y-5">
                <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Selecionar arquivo</label>
                    <input id="usuario-imagem-file" className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs" type="file" accept="image/*" />
                </div>
                <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Usar URL</label>
                    <div className="flex items-center gap-2">
                        <input id="usuario-imagem-url" className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs" placeholder="https://exemplo.com/imagem.jpg" type="text" />
                        <button id="usuario-imagem-use-url" className="h-9 px-4 rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-semibold" type="button">
                            Usar
                        </button>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button id="usuario-imagem-clear" className="px-4 py-2 rounded-lg bg-white border border-[#cfe7d1] text-forest-green text-xs font-semibold hover:bg-[#f6f8f6] transition-colors" type="button">
                        Limpar
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors" type="button" data-close-modal="usuarios-imagem">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    </div>





    </>
  );
}


