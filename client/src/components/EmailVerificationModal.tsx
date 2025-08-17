import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";

interface EmailVerificationModalProps {
  isOpen: boolean;
  email: string;
  onVerified: () => void;
  onClose: () => void;
}

export default function EmailVerificationModal({ 
  isOpen, 
  email, 
  onVerified, 
  onClose 
}: EmailVerificationModalProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) return;
    
    setIsVerifying(true);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Email verified and logged in successfully!",
        });
        onVerified();
        setVerificationCode("");
      } else {
        toast({
          title: "Verification Failed",
          description: data.error || "Invalid verification code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Code Sent",
          description: data.verificationCode 
            ? `New code: ${data.verificationCode}` 
            : "New verification code sent to your email",
        });
      } else {
        toast({
          title: "Failed to Send",
          description: data.error || "Could not resend verification code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Verify Your Email
          </DialogTitle>
          <DialogDescription>
            We've sent a 6-digit verification code to <strong>{email}</strong>.
            Please enter it below to complete your registration.
            <br />
            <small className="text-muted-foreground mt-2 block">
              (In development mode, the code is also shown in notifications)
            </small>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="text-center text-lg tracking-wider"
              maxLength={6}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isVerifying || verificationCode.length !== 6}
          >
            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify Email
          </Button>
        </form>

        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-muted-foreground">
            Didn't receive the code?
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResendCode}
            disabled={isResending}
          >
            {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Resend Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}