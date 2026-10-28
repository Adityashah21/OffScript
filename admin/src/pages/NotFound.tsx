import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { FileQuestion } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <FileQuestion className="h-16 w-16 text-muted-foreground/50 mb-4" />
      <h2 className="text-2xl font-bold tracking-tight">Page Not Found</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm mb-6">
        The administration view or resource you are looking for does not exist or has been moved.
      </p>
      <Link to="/">
        <Button variant="default">Back to Dashboard</Button>
      </Link>
    </div>
  );
};
