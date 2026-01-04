import { Undo2, PackageCheck, MailQuestion, CalendarClock, Info } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Trocas e Devoluções - PISA VIBE',
    description: 'Entenda nossa política de trocas e devoluções e saiba como solicitar a sua.',
};

export default function ReturnsPage() {
    return (
        <div className="container mx-auto max-w-4xl px-4 py-12">
            <header className="mb-10 text-center">
                <Undo2 className="mx-auto h-12 w-12 text-primary" />
                <h1 className="mt-4 font-headline text-4xl font-bold">Trocas e Devoluções</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Sua satisfação é nossa prioridade. Se precisar trocar ou devolver um produto, estamos aqui para ajudar.
                </p>
            </header>

            <main className="space-y-12">
                <section>
                    <h2 className="mb-4 flex items-center gap-3 font-headline text-2xl font-bold">
                        <Info className="h-7 w-7 text-primary" />
                        Nossa Política
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                        <p>
                            Você pode solicitar a troca ou devolução de um produto em até <strong>7 dias corridos</strong> após o recebimento.
                        </p>
                        <p>
                           O processo é simples e buscamos resolver tudo da forma mais rápida possível. Para que a troca ou devolução seja aceita, o produto precisa atender às seguintes condições:
                        </p>
                        <ul className="list-inside list-disc space-y-2 pl-4">
                            <li>O produto não pode apresentar sinais de uso, lavagem ou qualquer tipo de alteração.</li>
                            <li>Deve ser devolvido na embalagem original, com todas as etiquetas e tags intactas.</li>
                            <li>A nota fiscal (ou uma cópia) deve acompanhar o produto.</li>
                        </ul>
                    </div>
                </section>

                <section>
                    <h2 className="mb-4 flex items-center gap-3 font-headline text-2xl font-bold">
                        <MailQuestion className="h-7 w-7 text-primary" />
                        Como Solicitar a Troca ou Devolução
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                        <p>
                            Para iniciar o processo, basta entrar em contato com nossa equipe de atendimento através do e-mail <strong>suportepisavibe@gmail.com</strong> com o assunto "Troca e Devolução".
                        </p>
                        <p>No corpo do e-mail, por favor, informe:</p>
                         <ul className="list-inside list-disc space-y-2 pl-4">
                            <li>Número do pedido.</li>
                            <li>Nome completo e CPF do titular da compra.</li>
                            <li>Produto que deseja trocar ou devolver.</li>
                            <li>Motivo da troca ou devolução.</li>
                        </ul>
                         <p>Nossa equipe responderá em até 2 dias úteis com as instruções para o envio do produto.</p>
                    </div>
                </section>

                 <section className="rounded-lg border bg-secondary/50 p-6">
                    <h3 className="mb-2 font-semibold text-lg">Custos de Envio</h3>
                    <p className="text-muted-foreground">
                       A primeira troca ou devolução é por nossa conta! Você receberá um código de postagem para enviar o produto de volta sem custo. Caso precise de uma segunda troca, os custos de frete ficam por conta do cliente.
                    </p>
                </section>

                <section>
                    <h2 className="mb-4 flex items-center gap-3 font-headline text-2xl font-bold">
                        <PackageCheck className="h-7 w-7 text-primary" />
                        Opções Após a Devolução
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                        <p>
                           Assim que recebermos e analisarmos o produto devolvido, você poderá escolher entre:
                        </p>
                         <ul className="list-inside list-disc space-y-2 pl-4">
                            <li><strong>Trocar por outro produto:</strong> Você pode escolher um item de mesmo valor ou usar o crédito para comprar um produto de valor diferente, pagando a diferença se houver.</li>
                            <li><strong>Receber um vale-compras:</strong> Um cupom no valor do produto devolvido será gerado para você usar em futuras compras na loja, com validade de 90 dias.</li>
                            <li><strong>Reembolso do valor:</strong> O valor será estornado conforme a forma de pagamento original (cartão de crédito ou Pix).</li>
                        </ul>
                    </div>
                </section>

                <section className="border-t pt-8 text-center">
                     <h2 className="mb-4 font-headline text-2xl font-bold">
                       Dúvidas?
                    </h2>
                    <p className="text-muted-foreground">
                       Se tiver qualquer outra pergunta sobre nosso processo de trocas e devoluções, não hesite em nos contatar. Estamos à disposição para ajudar.
                    </p>
                    <p className="mt-4 font-semibold">
                         📩 suportepisavibe@gmail.com
                    </p>
                </section>
            </main>
        </div>
    );
}
