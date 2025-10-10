import { useState } from 'react';
import { useUniversalBack } from '@/hooks/use-universal-back';
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
  const universalBack = useUniversalBack();
  const handleBack = onBack || universalBack;
  
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
    <div className="plz-app">
      <div className="plz-bg" aria-hidden="true" />
      <div className="plz-container">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleBack}
            className="plz-iconbtn flex-shrink-0"
            aria-label="Retour"
          >
            <ChevronLeft size={18} />
          </button>
          <h1 className="plz-page-title p-0 flex-1">Aide</h1>
        </div>
        
        <div className="plz-content space-y-4">
          <div className="plz-card">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Votre email de réponse (optionnel)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="votre@email.com"
                  className="pliiz-input"
                />
                <p className="text-xs text-white/70">Nous vous répondrons à cette adresse.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-white">Description du problème</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Décrivez votre problème… (captures, étapes, appareil, etc.)"
                  rows={6}
                  className="pliiz-textarea"
                />
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <Button 
                className="w-full pliiz-btn" 
                onClick={handleHelpEmail}
                id="help-open-mail"
              >
                <Mail className="h-4 w-4 mr-2" />
                Ouvrir dans votre boîte
              </Button>
            </div>
          </div>

          {/* Help Info */}
          <div className="plz-card">
            <h3 className="font-medium mb-2 text-white">💡 Conseils</h3>
            <ul className="text-sm text-white/80 space-y-1">
              <li>• Soyez précis dans votre description</li>
              <li>• Incluez des captures d'écran si utile</li>
              <li>• Nous répondons sous 24h en général</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}