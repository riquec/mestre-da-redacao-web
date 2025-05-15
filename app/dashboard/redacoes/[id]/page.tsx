import { Suspense } from "react"
import { EssayDetails } from "./essay-details"

export const dynamic = 'force-dynamic'

type Props = {
  params: { id: string }
}

export default function Page({ params }: Props) {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EssayDetails id={params.id} />
    </Suspense>
  )
} 