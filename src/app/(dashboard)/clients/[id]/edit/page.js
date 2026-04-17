import { redirect } from 'next/navigation';

export default function EditClientPage({ params }) {
  redirect(`/clients/${params.id}?edit=true`);
}
