import { ProductCard } from "@/components/product-card";
import { products } from "@/lib/products";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const metadata = {
  title: "Produtos - PISA VIBE",
  description: "Explore nossa coleção de tênis e roupas.",
};

export default function ProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const category = searchParams["categoria"] as string | undefined;
  const searchQuery = searchParams["q"] as string | undefined;

  let filteredProducts = products;

  if (category) {
    filteredProducts = filteredProducts.filter(
      (p) => p.category === category
    );
  }

  if (searchQuery) {
    filteredProducts = filteredProducts.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const title = category
    ? category.charAt(0).toUpperCase() + category.slice(1)
    : "Todos os Produtos";

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
        <h1 className="font-headline text-4xl font-bold">
          {searchQuery ? `Busca por: "${searchQuery}"` : title}
        </h1>
        {/* TODO: Add sorting functionality */}
        {/* <div className="w-full md:w-auto">
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevância</SelectItem>
              <SelectItem value="price-asc">Preço: Menor para Maior</SelectItem>
              <SelectItem value="price-desc">Preço: Maior para Menor</SelectItem>
            </SelectContent>
          </Select>
        </div> */}
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">Nenhum produto encontrado.</p>
        </div>
      )}
    </div>
  );
}
