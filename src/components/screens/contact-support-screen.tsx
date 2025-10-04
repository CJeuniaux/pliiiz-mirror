import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, MessageCircle, HelpCircle, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { ScreenFixedBG } from '@/components/layout/screen-fixed-bg';
import { launchEmail } from '@/lib/email-launcher';

interface ContactSupportScreenProps {
  onBack: () => void;
}

// Constants
const SUPPORT_TO = "hello@app.pliiiz.com";
const SUBJECT_FALLBACK = "Assistance Pliiiz — demande d'aide";

function buildSupportEmail(desc: string, userEmail?: string) {
  const firstLine = (desc || "").split(/\r?\n/)[0].trim().slice(0, 60);
  const subject = firstLine ? `Assistance Pliiiz — ${firstLine}` : SUBJECT_FALLBACK;

  const meta = [
    "", 
    "— — —",
    `URL : ${typeof window !== "undefined" ? window.location.href : ""}`,
    `App : Pliiiz`,
    `Langue : ${typeof navigator !== "undefined" ? navigator.language : ""}`,
  ].join("\r\n");

  const body = [
    "Bonjour,",
    "",
    "Voici mon problème :",
    desc?.trim() || "(description non renseignée)",
    "",
    userEmail ? `Email de contact : ${userEmail}` : "",
    meta
  ].join("\r\n");

  return { subject, body };
}

export function ContactSupportScreen({ onBack }: ContactSupportScreenProps) {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    email: ''
  });

  const handleHelpEmail = () => {
    const desc = (formData.message || "").trim();
    const from = (formData.email || "").trim();
    const { subject, body } = buildSupportEmail(desc, from);
    // OUVERTURE SYNCHRONE AU CLIC
    launchEmail({ to: SUPPORT_TO, subject, body });
  };

  return (
    <ScreenFixedBG>
      <div className="p-4 pt-12">
        <Button variant="outline" size="sm" onClick={onBack} className="w-8 h-8 rounded-full p-0 mb-2 bg-muted/50">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold mb-4">Décrivez le problème</h1>
      </div>
      
      <div className="p-4 space-y-6 overflow-y-auto pb-20">
        <Card>
          <CardContent className="p-6 space-y-6">

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Votre email de réponse (optionnel)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="votre@email.com"
                />
                <p className="text-xs text-muted-foreground">Nous vous répondrons à cette adresse.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Description du problème</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Décrivez votre problème… (captures, étapes, appareil, etc.)"
                  rows={6}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                className="w-full bg-primary hover:bg-primary/90" 
                onClick={handleHelpEmail}
                id="help-open-mail"
              >
                <Mail className="h-4 w-4 mr-2" />
                Ouvrir dans votre boîte
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Info */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">💡 Conseils</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Soyez précis dans votre description</li>
              <li>• Incluez des captures d'écran si utile</li>
              <li>• Nous répondons sous 24h en général</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </ScreenFixedBG>
  );
}