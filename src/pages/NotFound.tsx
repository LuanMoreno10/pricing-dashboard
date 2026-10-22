import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/ui';

export default function NotFound() {
  return (
    <EmptyState
      icon={Compass}
      title="Page not found"
      text="That page doesn’t exist."
      action={
        <Link to="/" className="text-sm text-accent hover:underline">
          Back to overview
        </Link>
      }
    />
  );
}
