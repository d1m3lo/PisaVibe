export type MenuLink = {
  title: string;
  href: string;
};

export type MenuColumn = {
  title: string;
  links: MenuLink[];
};

export type MenuCategory = {
  title: string;
  columns: MenuColumn[];
};

export const megaMenuData: MenuCategory[] = [
  {
    title: "Masculino",
    columns: [
      {
        title: "Calçados",
        links: [
          { title: "Casual", href: "/produtos?genero=masculino&categoria=calcados&tipo=casual" },
          { title: "Chinelo", href: "/produtos?genero=masculino&categoria=calcados&tipo=chinelo" },
          { title: "StreetWear", href: "/produtos?genero=masculino&categoria=calcados&tipo=streetwear" },
          { title: "Sneakers", href: "/produtos?genero=masculino&categoria=calcados&tipo=sneakers" },
        ],
      },
      {
        title: "Roupas",
        links: [
          { title: "Camisetas", href: "/produtos?genero=masculino&categoria=roupas&tipo=camisetas" },
          { title: "Shorts", href: "/produtos?genero=masculino&categoria=roupas&tipo=shorts" },
          { title: "Polos", href: "/produtos?genero=masculino&categoria=roupas&tipo=polos" },
          { title: "Streetwear", href: "/produtos?genero=masculino&categoria=roupas&tipo=streetwear" },
        ],
      },
      {
        title: "Acessórios",
        links: [
          { title: "Bonés", href: "/produtos?genero=masculino&categoria=acessorios&tipo=bones" },
        ],
      },
       {
        title: "Perfumes",
        links: [
          { title: "Perfumes", href: "/produtos?genero=masculino&categoria=perfumes" },
        ],
      },
    ],
  },
  {
    title: "Feminino",
    columns: [
       {
        title: "Calçados",
        links: [
          { title: "Tênis", href: "/produtos?genero=feminino&categoria=calcados&tipo=tenis" },
          { title: "Casual", href: "/produtos?genero=feminino&categoria=calcados&tipo=casual" },
          { title: "Corrida", href: "/produtos?genero=feminino&categoria=calcados&tipo=corrida" },
          { title: "Basquete", href: "/produtos?genero=feminino&categoria=calcados&tipo=basquete" },
        ],
      },
      {
        title: "Roupas",
        links: [
          { title: "Camisetas", href: "/produtos?genero=feminino&categoria=roupas&tipo=camisetas" },
          { title: "Shorts", href: "/produtos?genero=feminino&categoria=roupas&tipo=shorts" },
          { title: "Jaquetas & Moletons", href: "/produtos?genero=feminino&categoria=roupas&tipo=moletons" },
          { title: "Calças & Leggings", href: "/produtos?genero=feminino&categoria=roupas&tipo=calcas" },
          { title: "Saias & Vestidos", href: "/produtos?genero=feminino&categoria=roupas&tipo=saias-e-vestidos" },
        ],
      },
      {
        title: "Acessórios",
        links: [
          { title: "Bolas", href: "/produtos?genero=feminino&categoria=acessorios&tipo=bolas" },
          { title: "Bonés & Viseiras", href: "/produtos?genero=feminino&categoria=acessorios&tipo=bones" },
          { title: "Bolsas & Mochilas", href: "/produtos?genero=feminino&categoria=acessorios&tipo=mochilas" },
        ],
      },
       {
        title: "Perfumes",
        links: [
          { title: "Perfumes", href: "/produtos?genero=feminino&categoria=perfumes" },
        ],
      },
    ]
  },
  {
    title: "Lançamentos",
    columns: [
        { title: "Masculino", links: [{ title: "Ver tudo", href: "/produtos?categoria=lancamentos&genero=masculino" }] },
        { title: "Feminino", links: [{ title: "Ver tudo", href: "/produtos?categoria=lancamentos&genero=feminino" }] },
    ]
  },
  {
    title: "Ofertas",
    columns: [
        { title: "Masculino", links: [{ title: "Ver tudo", href: "/produtos?categoria=ofertas&genero=masculino" }] },
        { title: "Feminino", links: [{ title: "Ver tudo", href: "/produtos?categoria=ofertas&genero=feminino" }] },
    ]
  }
];
