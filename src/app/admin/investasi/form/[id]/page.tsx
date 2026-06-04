import InvestasiForm from '../../components/InvestasiForm'

export default async function EditInvestasiPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <InvestasiForm id={id} />
}
