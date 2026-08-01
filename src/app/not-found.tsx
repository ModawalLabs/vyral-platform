import { ButtonLink } from "@/components/ui/button-link";
import { routes } from "@/config/routes";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The page you are looking for does not exist or has moved.
      </p>
      <ButtonLink href={routes.home} className="mt-2">
        Back home
      </ButtonLink>
    </div>
  );
}
