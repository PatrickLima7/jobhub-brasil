import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AlertBannerProps {
  message: string;
  linkTo?: string;
  linkLabel?: string;
}

export function AlertBanner({ message, linkTo, linkLabel }: AlertBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-md border-l-[3px] border-accent bg-accent-soft px-4 py-3 text-sm text-accent-foreground">
      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
      <div>
        <span>{message}</span>
        {linkTo && (
          <>
            {' '}
            <Link to={linkTo} className="font-medium underline underline-offset-2">
              {linkLabel ?? 'Completar'}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
