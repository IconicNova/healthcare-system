'use client';

import { useState, useEffect } from 'react';
import ClientForm from '@/components/clients/ClientForm';

export default function EditClientPage({ params }) {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClient() {
      try {
        const response = await fetch(`/api/clients/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setClient(data);
        }
      } catch (error) {
        console.error('Error fetching client:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchClient();
  }, [params.id]);

  return <ClientForm client={client} />;
}
