
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
          { title: "Calças", href: "/produtos?genero=masculino&categoria=roupas&tipo=calcas" },
          { title: "Shorts", href: "/produtos?genero=masculino&categoria=roupas&tipo=shorts" },
          { title: "Polos", href: "/produtos?genero=masculino&categoria=roupas&tipo=polos" },
          { title: "Streetwear", href: "/produtos?genero=masculino&categoria=roupas&tipo=streetwear" },
        ],
      },
      {
        title: "Acessórios",
        links: [
          { title: "Bonés", href: "/produtos?genero=masculino&categoria=acessorios&tipo=bones" },
          { title: "Mochila", href: "/produtos?genero=masculino&categoria=acessorios&tipo=mochilas" },
          { title: "Relógios", href: "/produtos?genero=masculino&categoria=acessorios&tipo=relogios" },
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
          { title: "Casual", href: "/produtos?genero=feminino&categoria=calcados&tipo=casual" },
          { title: "Sandálias", href: "/produtos?genero=feminino&categoria=calcados&tipo=sandalias" },
          { title: "Chinelo", href: "/produtos?genero=feminino&categoria=calcados&tipo=chinelo" },
          { title: "StreetWear", href: "/produtos?genero=feminino&categoria=calcados&tipo=streetwear" },
          { title: "Sneakers", href: "/produtos?genero=feminino&categoria=calcados&tipo=sneakers" },
        ],
      },
      {
        title: "Roupas",
        links: [
          { title: "Camisetas", href: "/produtos?genero=feminino&categoria=roupas&tipo=camisetas" },
          { title: "Vestidos", href: "/produtos?genero=feminino&categoria=roupas&tipo=vestidos" },
          { title: "Calças & Leggings", href: "/produtos?genero=feminino&categoria=roupas&tipo=calcas" },
          { title: "Streetwear", href: "/produtos?genero=feminino&categoria=roupas&tipo=streetwear" },
        ],
      },
      {
        title: "Acessórios",
        links: [
          { title: "Bonés", href: "/produtos?genero=feminino&categoria=acessorios&tipo=bones" },
          { title: "Bolsas", href: "/produtos?genero=feminino&categoria=acessorios&tipo=bolsas" },
          { title: "Mochilas", href: "/produtos?genero=feminino&categoria=acessorios&tipo=mochilas" },
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
      {
        title: "Masculino",
        links: [
            { title: "Calçados", href: "/produtos?categoria=lancamentos&genero=masculino&tipo=calcados" },
            { title: "Roupas", href: "/produtos?categoria=lancamentos&genero=masculino&tipo=roupas" },
            { title: "Acessórios", href: "/produtos?categoria=lancamentos&genero=masculino&tipo=acessorios" },
            { title: "Perfumes", href: "/produtos?categoria=lancamentos&genero=masculino&tipo=perfumes" },
        ],
      },
      {
        title: "Feminino",
        links: [
            { title: "Calçados", href: "/produtos?categoria=lancamentos&genero=feminino&tipo=calcados" },
            { title: "Roupas", href: "/produtos?categoria=lancamentos&genero=feminino&tipo=roupas" },
            { title: "Acessórios", href: "/produtos?categoria=lancamentos&genero=feminino&tipo=acessorios" },
            { title: "Perfumes", href: "/produtos?categoria=lancamentos&genero=feminino&tipo=perfumes" },
        ],
      },
    ],
  },
  {
    title: "Ofertas",
    columns: [
       {
        title: "Masculino",
        links: [
            { title: "Calçados", href: "/produtos?categoria=ofertas&genero=masculino&tipo=calcados" },
            { title: "Roupas", href: "/produtos?categoria=ofertas&genero=masculino&tipo=roupas" },
            { title: "Acessórios", href: "/produtos?categoria=ofertas&genero=masculino&tipo=acessorios" },
            { title: "Perfumes", href: "/produtos?categoria=ofertas&genero=masculino&tipo=perfumes" },
        ],
      },
      {
        title: "Feminino",
        links: [
            { title: "Calçados", href: "/produtos?categoria=ofertas&genero=feminino&tipo=calcados" },
            { title: "Roupas", href: "/produtos?categoria=ofertas&genero=feminino&tipo=roupas" },
            { title: "Acessórios", href: "/produtos?categoria=ofertas&genero=feminino&tipo=acessorios" },
            { title: "Perfumes", href: "/produtos?categoria=ofertas&genero=feminino&tipo=perfumes" },
        ],
      },
    ],
  }
];
