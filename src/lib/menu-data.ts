
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
          { title: "Streetwear", href: "/produtos?genero=masculino&categoria=calcados&tipo=streetwear" },
          { title: "Sneakers", href: "/produtos?genero=masculino&categoria=calcados&tipo=sneakers" },
        ],
      },
      {
        title: "Roupas",
        links: [
          { title: "Casual", href: "/produtos?genero=masculino&categoria=roupas&tipo=casual" },
          { title: "Camisetas", href: "/produtos?genero=masculino&categoria=roupas&tipo=camisetas" },
          { title: "Moletom", href: "/produtos?genero=masculino&categoria=roupas&tipo=moletom" },
          { title: "Calças", href: "/produtos?genero=masculino&categoria=roupas&tipo=calcas" },
          { title: "Bermudas", href: "/produtos?genero=masculino&categoria=roupas&tipo=bermudas" },
          { title: "Polos", href: "/produtos?genero=masculino&categoria=roupas&tipo=polos" },
          { title: "Streetwear", href: "/produtos?genero=masculino&categoria=roupas&tipo=streetwear" },
        ],
      },
      {
        title: "Acessórios",
        links: [
          { title: "Bonés", href: "/produtos?genero=masculino&categoria=acessorios&tipo=bonés" },
          { title: "Relógios", href: "/produtos?genero=masculino&categoria=acessorios&tipo=relogios" },
          { title: "Bag", href: "/produtos?genero=masculino&categoria=acessorios&tipo=bag" },
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
          { title: "Streetwear", href: "/produtos?genero=feminino&categoria=calcados&tipo=streetwear" },
          { title: "Sneakers", href: "/produtos?genero=feminino&categoria=calcados&tipo=sneakers" },
        ],
      },
      {
        title: "Roupas",
        links: [
          { title: "Casual", href: "/produtos?genero=feminino&categoria=roupas&tipo=casual" },
          { title: "Vestidos", href: "/produtos?genero=feminino&categoria=roupas&tipo=vestidos" },
          { title: "Moletom", href: "/produtos?genero=feminino&categoria=roupas&tipo=moletom" },
          { title: "Calças", href: "/produtos?genero=feminino&categoria=roupas&tipo=calcas" },
          { title: "Streetwear", href: "/produtos?genero=feminino&categoria=roupas&tipo=streetwear" },
        ],
      },
      {
        title: "Acessórios",
        links: [
          { title: "Bolsas", href: "/produtos?genero=feminino&categoria=acessorios&tipo=bolsas" },
          { title: "Relógios", href: "/produtos?genero=feminino&categoria=acessorios&tipo=relogios" },
          { title: "Bag", href: "/produtos?genero=feminino&categoria=acessorios&tipo=bag" },
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
            { title: "Calçados", href: "/produtos?categoria=lancamentos,calcados&genero=masculino" },
            { title: "Roupas", href: "/produtos?categoria=lancamentos,roupas&genero=masculino" },
            { title: "Acessórios", href: "/produtos?categoria=lancamentos,acessorios&genero=masculino" },
            { title: "Perfumes", href: "/produtos?categoria=lancamentos,perfumes&genero=masculino" },
        ],
      },
      {
        title: "Feminino",
        links: [
            { title: "Calçados", href: "/produtos?categoria=lancamentos,calcados&genero=feminino" },
            { title: "Roupas", href: "/produtos?categoria=lancamentos,roupas&genero=feminino" },
            { title: "Acessórios", href: "/produtos?categoria=lancamentos,acessorios&genero=feminino" },
            { title: "Perfumes", href: "/produtos?categoria=lancamentos,perfumes&genero=feminino" },
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
            { title: "Calçados", href: "/produtos?categoria=ofertas,calcados&genero=masculino" },
            { title: "Roupas", href: "/produtos?categoria=ofertas,roupas&genero=masculino" },
            { title: "Acessórios", href: "/produtos?categoria=ofertas,acessorios&genero=masculino" },
            { title: "Perfumes", href: "/produtos?categoria=ofertas,perfumes&genero=masculino" },
        ],
      },
      {
        title: "Feminino",
        links: [
            { title: "Calçados", href: "/produtos?categoria=ofertas,calcados&genero=feminino" },
            { title: "Roupas", href: "/produtos?categoria=ofertas,roupas&genero=feminino" },
            { title: "Acessórios", href: "/produtos?categoria=ofertas,acessorios&genero=feminino" },
            { title: "Perfumes", href: "/produtos?categoria=ofertas,perfumes&genero=feminino" },
        ],
      },
    ],
  },
  {
    title: "Importados",
    columns: [
      {
        title: "Masculino",
        links: [
            { title: "Todos", href: "/produtos?categoria=importados&genero=masculino" },
        ],
      },
      {
        title: "Feminino",
        links: [
            { title: "Todos", href: "/produtos?categoria=importados&genero=feminino" },
        ],
      },
    ],
  }
];
