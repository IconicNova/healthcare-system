import { redirect } from 'next/navigation';

export default function CarePlanEditPage({ params }) {
  redirect(`/care-plans/${params.id}?edit=true`);
}
