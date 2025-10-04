import { ContactsScreenEnhanced } from './contacts-screen-enhanced';

interface ContactsScreenProps {
  onBack: () => void;
}

export function ContactsScreen({ onBack }: ContactsScreenProps) {
  return <ContactsScreenEnhanced onBack={onBack} />;
}