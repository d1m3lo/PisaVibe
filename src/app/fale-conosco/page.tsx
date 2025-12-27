import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";

export const metadata = {
  title: "Fale Conosco - PISA VIBE",
  description: "Entre em contato conosco para dúvidas, sugestões ou suporte.",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="font-headline text-4xl font-bold">Fale Conosco</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Tem alguma dúvida, sugestão ou precisa de suporte? Preencha o
          formulário abaixo ou use um de nossos canais de atendimento.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <div className="space-y-8">
            <div>
                 <h2 className="mb-4 font-headline text-2xl font-bold">Informações de Contato</h2>
                 <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Mail className="h-6 w-6 text-primary" />
                        <div>
                            <h3 className="font-semibold">E-mail</h3>
                            <a href="mailto:suporte@pisavibe.com" className="text-muted-foreground hover:text-primary">suporte@pisavibe.com</a>
                        </div>
                    </div>
                     <div className="flex items-center gap-4">
                        <Phone className="h-6 w-6 text-primary" />
                        <div>
                            <h3 className="font-semibold">WhatsApp</h3>
                            <p className="text-muted-foreground">(11) 99999-9999</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4">
                        <MapPin className="h-6 w-6 text-primary" />
                        <div>
                            <h3 className="font-semibold">Endereço</h3>
                            <p className="text-muted-foreground">Av. Principal, 123 - São Paulo/SP (Escritório)</p>
                        </div>
                    </div>
                 </div>
            </div>
            <div>
                <h2 className="mb-4 font-headline text-2xl font-bold">Horário de Atendimento</h2>
                <p className="text-muted-foreground">Segunda a Sexta: 9h às 18h</p>
                <p className="text-muted-foreground">Sábado: 9h às 13h</p>
            </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Envie uma Mensagem</CardTitle>
            <CardDescription>
              Responderemos o mais breve possível.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" placeholder="Seu nome completo" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto</Label>
                <Input id="subject" placeholder="Sobre o que você quer falar?" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  placeholder="Digite sua mensagem aqui..."
                  className="min-h-[120px]"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Enviar Mensagem
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
