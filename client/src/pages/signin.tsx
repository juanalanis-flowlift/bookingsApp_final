import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { SiGoogle } from "react-icons/si";
import { ArrowLeft, Mail } from "lucide-react";
import { Link } from "wouter";

export default function SignIn() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-home">
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Button>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("signin.title")}</CardTitle>
            <CardDescription>{t("signin.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <a href="/auth/google" className="block">
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-3 h-12"
                data-testid="button-signin-google"
              >
                <SiGoogle className="h-5 w-5" />
                {t("signin.google")}
              </Button>
            </a>
            <a href="/auth/microsoft" className="block">
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-3 h-12"
                data-testid="button-signin-microsoft"
              >
                <Mail className="h-5 w-5" />
                {t("signin.microsoft")}
              </Button>
            </a>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
