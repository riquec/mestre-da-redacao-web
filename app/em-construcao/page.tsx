import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Construction } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function EmConstrucao() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Construction className="h-16 w-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Em Construção</CardTitle>
          <CardDescription className="text-center">
            Estamos trabalhando para trazer essa funcionalidade em breve!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            O chat com o professor está em desenvolvimento e será disponibilizado em breve. 
            Agradecemos sua compreensão enquanto trabalhamos para melhorar sua experiência.
          </p>
          <div className="flex justify-center">
            <Link href="/dashboard">
              <Button variant="outline">Voltar ao Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 