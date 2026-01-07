import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SiGoogle } from "react-icons/si";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 1h10v10H1V1z" fill="#F25022"/>
      <path d="M12 1h10v10H12V1z" fill="#7FBA00"/>
      <path d="M1 12h10v10H1V12z" fill="#00A4EF"/>
      <path d="M12 12h10v10H12V12z" fill="#FFB900"/>
    </svg>
  );
}

export default function Login() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-primary/10 dark:bg-primary/5 flex flex-col">
      <header className="flex items-center justify-between p-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-home">
            <ArrowLeft className="h-4 w-4" />
            {t("login.backToHome")}
          </Button>
        </Link>
        <ThemeToggle />
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2" data-testid="text-login-title">
                {t("login.title")}
              </h1>
              <p className="text-muted-foreground" data-testid="text-login-subtitle">
                {t("login.subtitle")}
              </p>
            </div>

            <div className="space-y-3">
              <a href="/auth/google" className="block">
                <Button
                  variant="outline"
                  className="w-full h-12 gap-3 text-base"
                  data-testid="button-login-google"
                >
                  <SiGoogle className="h-5 w-5" />
                  {t("login.continueWithGoogle")}
                </Button>
              </a>

              <a href="/auth/microsoft" className="block">
                <Button
                  variant="outline"
                  className="w-full h-12 gap-3 text-base"
                  data-testid="button-login-microsoft"
                >
                  <MicrosoftIcon className="h-5 w-5" />
                  {t("login.continueWithOutlook")}
                </Button>
              </a>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {t("login.termsNotice")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
