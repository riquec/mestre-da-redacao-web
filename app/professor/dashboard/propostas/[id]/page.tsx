import PropostaDetalhesClient from "./proposta-detalhes-client"

// Configuração para página dinâmica
export const dynamic = 'force-dynamic'

type Props = {
  params: { id: string }
}

export default function Page({ params }: Props) {
  return <PropostaDetalhesClient params={params} />
} 