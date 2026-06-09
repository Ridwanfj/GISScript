'use client'

import { use } from 'react'
import IproForm from '../../components/IproForm'

export default function EditIproPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <IproForm id={id} />
}
