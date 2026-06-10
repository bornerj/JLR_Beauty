export type ProductInventorySeedEntry = {
  readonly name: string;
  readonly categoryName: string;
  readonly price: number;
  readonly stock: number;
  readonly patrimony: number;
  readonly sku: string;
};

export const productInventorySeed: readonly ProductInventorySeedEntry[] = [
  {
    name: "Base (Unha de Pedra)",
    categoryName: "Produtos",
    price: 35,
    stock: 0,
    patrimony: 0,
    sku: "JLR-EST-001",
  },
  {
    name: "Base (Unha Fortalecida)",
    categoryName: "Produtos",
    price: 35,
    stock: 3,
    patrimony: 105,
    sku: "JLR-EST-002",
  },
  {
    name: "Chinelo Descartavel",
    categoryName: "Produtos",
    price: 10,
    stock: 27,
    patrimony: 270,
    sku: "JLR-EST-003",
  },
  {
    name: "Cuti Express 100 ML",
    categoryName: "Produtos",
    price: 29.9,
    stock: 100,
    patrimony: 2990,
    sku: "JLR-EST-004",
  },
  {
    name: "Cuti Express 500 ML",
    categoryName: "Produtos",
    price: 69.9,
    stock: 25,
    patrimony: 1747.5,
    sku: "JLR-EST-005",
  },
  {
    name: "FreePee Go",
    categoryName: "Produtos",
    price: 10,
    stock: 30,
    patrimony: 300,
    sku: "JLR-EST-006",
  },
  {
    name: "Lymp Clean (Higienizador de Pinceis Maquiagem)",
    categoryName: "Produtos",
    price: 39.9,
    stock: 15,
    patrimony: 598.5,
    sku: "JLR-EST-007",
  },
  {
    name: "Nutry Cutis (Caneta Hidratante de Cuticulas)",
    categoryName: "Produtos",
    price: 25,
    stock: 199,
    patrimony: 4975,
    sku: "JLR-EST-008",
  },
];
