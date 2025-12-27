

"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Search, ShoppingCart, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { ChevronDown } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { products } from "@/lib/products";
import Image from "next/image";

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
      className="relative transition-transform duration-200 hover:-translate-y-1"
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
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  const searchResults = React.useMemo(() => {
    if (query.trim().length < 2) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);
  }, [query]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/produtos?q=${query}`);
      setIsPopoverOpen(false);
      setQuery("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    if(newQuery.trim().length > 1) {
      setIsPopoverOpen(true);
    } else {
      setIsPopoverOpen(false);
    }
  }
  
  const closePopover = () => {
    setIsPopoverOpen(false);
    setQuery("");
  }


  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <form onSubmit={handleSearch} className="relative hidden md:block">
          <Input
            type="search"
            placeholder="Buscar produtos..."
            className="w-48 pr-10 lg:w-64"
            value={query}
            onChange={handleInputChange}
            onClick={() => query.trim().length > 1 && setIsPopoverOpen(true)}
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
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-2 lg:w-[400px]" align="start">
        {searchResults.length > 0 ? (
          <div className="flex flex-col gap-2">
            {searchResults.map((product) => (
              <Link
                key={product.id}
                href={`/produtos/${product.id}`}
                className="flex items-center gap-4 rounded-md p-2 hover:bg-accent"
                onClick={closePopover}
              >
                <div className="relative h-16 w-16 flex-shrink-0">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="rounded-md object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    R$ {product.price.toFixed(2).replace(".", ",")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="p-4 text-center text-sm text-muted-foreground">
            Nenhum resultado encontrado.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
};


const mainCategories = [
  { name: "Masculino", href: "masculino", description: "Roupas e calçados para homens." },
  { name: "Feminino", href: "feminino", description: "Roupas e calçados para mulheres." },
];

const subcategories = [
  { name: "Calçados", href: "calcados" },
  { name: "Roupas", href: "roupas" },
  { name: "Acessórios", href: "acessorios" },
  { name: "Perfumes", href: "perfumes" },
];

const specialCategories = [
  { name: "Lançamentos", href: "lancamentos", description: "Veja os últimos lançamentos." },
  { name: "Ofertas", href: "ofertas", description: "Produtos com preços especiais." }
];


const ListItem = React.forwardRef<
  React.ElementRef<typeof Link>,
  React.ComponentPropsWithoutRef<typeof Link>
>(({ className, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          className={cn(
            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            className
          )}
          {...props}
        >
          {children}
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = 'ListItem';

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
           <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {mainCategories.map((category) => (
                 <NavigationMenuItem key={category.name}>
                  <NavigationMenuTrigger>{category.name}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] grid-cols-2 gap-3 p-4">
                      {subcategories.map((sub) => (
                        <ListItem key={sub.name} href={`/produtos?categoria=${category.href}&tipo=${sub.href}`}>
                          <div className="text-sm font-medium">{sub.name}</div>
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
              {specialCategories.map((category) => (
                <NavigationMenuItem key={category.name}>
                  <NavigationMenuTrigger>{category.name}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[500px] grid-cols-2 gap-4 p-4">
                      {mainCategories.map((mainCat) => (
                        <div key={mainCat.name} className="flex flex-col">
                          <h3 className="mb-2 text-base font-semibold">{mainCat.name}</h3>
                          <ul className="flex flex-col gap-1 pl-1">
                            {subcategories.map((sub) => (
                              <ListItem
                                key={sub.name}
                                href={`/produtos?categoria=${category.href}&genero=${mainCat.href}&tipo=${sub.href}`}
                                className="text-sm text-muted-foreground hover:text-foreground"
                              >
                                {sub.name}
                              </ListItem>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
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
