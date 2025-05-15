import { Suspense } from "react"
import { ProposalDetails } from "./proposal-details"

export const dynamic = 'force-dynamic'

type Props = {
  params: { id: string }
}

export default function Page({ params }: Props) {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ProposalDetails id={params.id} />
    </Suspense>
  )
} 