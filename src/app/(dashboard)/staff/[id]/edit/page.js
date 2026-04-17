import { redirect } from 'next/navigation';

export default function EditStaffPage({ params }) {
  redirect(`/staff/${params.id}?edit=true`);
}
