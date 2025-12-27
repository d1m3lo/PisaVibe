import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata = {
  title: "Dúvidas Frequentes - PISA VIBE",
  description: "Encontre respostas para as perguntas mais comuns sobre nossos produtos, pagamentos, entregas e devoluções.",
};

export default function FaqPage() {
  const faqs = [
    {
      question: "Quais são as formas de pagamento aceitas?",
      answer:
        "Aceitamos as principais bandeiras de cartão de crédito (Visa, MasterCard, American Express), Pix e boleto bancário. O pagamento pode ser parcelado em até 6x sem juros no cartão de crédito.",
    },
    {
      question: "Qual é o prazo de entrega?",
      answer:
        "O prazo de entrega varia de acordo com a sua localização. Oferecemos frete grátis para todo o Brasil. Você pode calcular o prazo exato inserindo seu CEP na página do produto ou no carrinho de compras. Em média, as entregas levam de 5 a 10 dias úteis.",
    },
    {
      question: "Como funciona a política de trocas e devoluções?",
      answer:
        "Se você não estiver satisfeito com sua compra, pode solicitar a troca ou devolução em até 7 dias corridos após o recebimento do produto. O produto deve estar em perfeitas condições, sem sinais de uso, e na embalagem original. Para iniciar o processo, entre em contato com nosso suporte.",
    },
    {
      question: "Como posso rastrear meu pedido?",
      answer:
        "Assim que seu pedido for despachado, você receberá um e-mail com o código de rastreamento e um link para acompanhar a entrega diretamente no site da transportadora.",
    },
    {
      question: "Os produtos têm garantia?",
      answer:
        "Para oferecer uma ampla variedade de estilos e preços, trabalhamos com diferentes fornecedores e classificações de qualidade, por isso nossos produtos não possuem uma garantia padrão. No entanto, todos os itens passam por uma rigorosa verificação de qualidade antes do envio para assegurar que você receba seu pedido em perfeitas condições. Se notar qualquer problema no momento do recebimento, por favor, entre em contato com nosso suporte em até 7 dias corridos para que possamos avaliar e resolver a situação.",
    },
     {
      question: "Como entro em contato com o suporte ao cliente?",
      answer:
        "Você pode entrar em contato conosco através do formulário na página 'Fale Conosco', pelo e-mail suporte@pisavibe.com ou pelo nosso WhatsApp durante o horário comercial. Estamos sempre prontos para ajudar!",
    },
  ];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="font-headline text-4xl font-bold">Dúvidas Frequentes</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Encontre aqui as respostas para as perguntas mais comuns.
        </p>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-base text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
