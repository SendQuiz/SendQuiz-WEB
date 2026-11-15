import { permanentRedirect } from 'next/navigation';

export default function PolicyPage() {
  permanentRedirect('/policy/terms-of-service');
}
