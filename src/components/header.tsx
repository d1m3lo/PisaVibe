
"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronDown, Menu, Search, ShoppingCart, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/context/cart-context";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { cn } from "@/lib/utils";

const NavLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className="text-foreground/80 transition-colors hover:text-foreground"
  >
    {children}
  </Link>
);

const UserMenu = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="transition-transform duration-200 hover:-translate-y-1"
      >
        <User className="h-5 w-5" />
        <span className="sr-only">Menu do usuário</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link href="/login">Login</Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/registrar">Registrar</Link>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const CartButton = () => {
  const { cartCount } = useCart();
  return (
    <Button
      variant="ghost"
      size="icon"
      asChild
      className="transition-transform duration-200 hover:-translate-y-1"
    >
      <Link href="/carrinho" aria-label="Carrinho de compras">
        <ShoppingCart className="h-5 w-5" />
        {cartCount > 0 && (
          <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {cartCount}
          </span>
        )}
      </Link>
    </Button>
  );
};

const SearchBar = () => {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/produtos?q=${query}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative hidden md:block">
      <Input
        type="search"
        placeholder="Buscar produtos..."
        className="w-48 pr-10 lg:w-64"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground"
      >
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
};

const mainCategories = [
  { name: "Masculino", href: "masculino" },
  { name: "Feminino", href: "feminino" },
];

const subcategories = [
  { name: "Calçados", href: "calcados" },
  { name: "Roupas", href: "roupas" },
  { name: "Acessórios", href: "acessorios" },
  { name: "Perfumes", href: "perfumes" },
];

const NavMenu = ({ category }: { category: { name: string; href: string } }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="flex items-center gap-1 p-0 text-sm font-medium text-foreground/80 hover:bg-transparent hover:text-foreground">
        {category.name}
        <ChevronDown className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      {subcategories.map((sub) => (
        <DropdownMenuItem key={sub.href} asChild>
          <Link href={`/produtos?categoria=${category.href}&tipo=${sub.href}`}>{sub.name}</Link>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

const LabeledNavMenu = ({ label, href }: { label: string; href: string }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1 p-0 text-sm font-medium text-foreground/80 hover:bg-transparent hover:text-foreground">
                {label}
                <ChevronDown className="h-4 w-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            {mainCategories.map((cat) => (
                <DropdownMenuSub key={cat.href}>
                    <DropdownMenuSubTrigger>{cat.name}</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            {subcategories.map((sub) => (
                                <DropdownMenuItem key={sub.href} asChild>
                                    <Link href={`/produtos?categoria=${href}&genero=${cat.href}&tipo=${sub.href}`}>{sub.name}</Link>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
            ))}
        </DropdownMenuContent>
    </DropdownMenu>
);


const MobileSubMenu = ({
  category,
  onClose,
}: {
  category: { name: string; href: string };
  onClose: () => void;
}) => (
  <Collapsible>
    <CollapsibleTrigger className="flex w-full items-center justify-between text-lg text-foreground/80 transition-colors hover:text-foreground">
      {category.name}
      <ChevronDown className="h-5 w-5" />
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div className="mt-2 flex flex-col gap-2 pl-4">
        {subcategories.map((sub) => (
          <Link
            key={sub.href}
            href={`/produtos?categoria=${category.href}&tipo=${sub.href}`}
            className="text-base text-foreground/70"
            onClick={onClose}
          >
            {sub.name}
          </Link>
        ))}
      </div>
    </CollapsibleContent>
  </Collapsible>
);

const MobileLabeledSubMenu = ({
  label,
  href,
  onClose,
}: {
  label: string;
  href: string;
  onClose: () => void;
}) => (
  <Collapsible>
    <CollapsibleTrigger className="flex w-full items-center justify-between text-lg text-foreground/80 transition-colors hover:text-foreground">
      {label}
      <ChevronDown className="h-5 w-5" />
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div className="mt-2 flex flex-col gap-2 pl-4">
        {mainCategories.map((cat) => (
          <Collapsible key={cat.href}>
            <CollapsibleTrigger className="flex w-full items-center justify-between text-base text-foreground/70">
              {cat.name}
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 flex flex-col gap-2 pl-4">
                {subcategories.map((sub) => (
                  <Link
                    key={sub.href}
                    href={`/produtos?categoria=${href}&genero=${cat.href}&tipo=${sub.href}`}
                    className="text-sm text-foreground/60"
                    onClick={onClose}
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </CollapsibleContent>
  </Collapsible>
);


export default function Header() {
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="font-headline text-xl font-bold tracking-tight"
          >
            PISA VIBE
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
             {mainCategories.map((cat) => (
              <NavMenu key={cat.href} category={cat} />
            ))}
            <LabeledNavMenu label="Lançamentos" href="lancamentos" />
            <LabeledNavMenu label="Ofertas" href="ofertas" />
          </nav>
        </div>

        <div className="flex items-center justify-end gap-2">
          <SearchBar />
          <div className="hidden md:flex">
             <UserMenu />
          </div>
          <CartButton />
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col gap-6 p-4">
                <Link href="/" className="font-headline text-xl font-bold" onClick={() => setIsSheetOpen(false)}>
                  PISA VIBE
                </Link>
                <nav className="flex flex-col gap-4">
                   {mainCategories.map((cat) => (
                    <MobileSubMenu key={cat.href} category={cat} onClose={() => setIsSheetOpen(false)} />
                  ))}
                  <MobileLabeledSubMenu label="Lançamentos" href="lancamentos" onClose={() => setIsSheetOpen(false)} />
                  <MobileLabeledSubMenu label="Ofertas" href="ofertas" onClose={() => setIsSheetOpen(false)} />
                </nav>
                 <div className="border-t pt-4">
                  <UserMenu />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

