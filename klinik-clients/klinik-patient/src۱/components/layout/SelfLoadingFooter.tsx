'use client';

import { useEffect, useState } from 'react';
import { Footer } from './Footer';
import { getClinic, listClinicContacts } from '@/services';
import type { Clinic, ClinicContact } from '@/types/domain';

/**
 * The footer for pages that are not server-rendered — today only the logged-in
 * patient area, which is behind a login, excluded in robots.txt and therefore
 * has no reason to pay for server rendering. Public pages pass the clinic in
 * from the server instead, so their address and phone number are in the
 * delivered HTML.
 */
export function SelfLoadingFooter() {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [contacts, setContacts] = useState<ClinicContact[]>([]);

  useEffect(() => {
    Promise.allSettled([getClinic(), listClinicContacts({ limit: 50 })]).then(
      ([clinicRes, contactsRes]) => {
        if (clinicRes.status === 'fulfilled') setClinic(clinicRes.value);
        if (contactsRes.status === 'fulfilled') setContacts(contactsRes.value.data);
      },
    );
  }, []);

  return <Footer clinic={clinic} contacts={contacts} />;
}
