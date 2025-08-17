import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showOtpLogin, setShowOtpLogin] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const { login, register, verifyEmail, forgotPassword, resetPassword, loginWithOtp, verifyOtp } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await login(email, password, rememberMe);
      if (result === true) {
        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
        onClose();
        resetForm();
      } else if (typeof result === 'object' && result.needsVerification) {
        // Handle verification needed case
        setNeedsVerification(true);
        setVerificationEmail(result.email);
        toast({
          title: "Verification Required",
          description: result.message,
        });
        // Show verification code in development
        if (result.verificationCode) {
          toast({
            title: "Development Code",
            description: `Verification code: ${result.verificationCode}`,
          });
        }
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid email or password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await register(email, password, firstName, lastName);
      if (result.success && result.needsVerification) {
        setNeedsVerification(true);
        setVerificationEmail(result.email || email);
        toast({
          title: "Registration Successful",
          description: "Please check your email for verification code.",
        });
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await verifyEmail(verificationEmail, verificationCode);
      if (success) {
        toast({
          title: "Email Verified",
          description: "Your account has been verified and you're now logged in!",
        });
        onClose();
        resetForm();
      } else {
        toast({
          title: "Verification Failed",
          description: "Invalid verification code.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await forgotPassword(forgotPasswordEmail);
      if (result.success) {
        setShowForgotPassword(false);
        setShowResetPassword(true);
        toast({
          title: "Reset Code Sent",
          description: result.message,
        });
      } else {
        toast({
          title: "Request Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Request Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await resetPassword(forgotPasswordEmail, resetCode, newPassword);
      if (success) {
        toast({
          title: "Password Reset",
          description: "Your password has been reset successfully! You can now log in.",
        });
        setShowResetPassword(false);
        resetForm();
      } else {
        toast({
          title: "Reset Failed",
          description: "Invalid reset code or request failed.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await loginWithOtp(otpEmail);
      if (result.success) {
        toast({
          title: "One-Time Password Sent",
          description: result.message,
        });
        // Don't close modal, show code input instead
        setShowOtpLogin(false);
        setShowOtpVerification(true);
      } else {
        toast({
          title: "Request Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Request Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await verifyOtp(otpEmail, otpCode, rememberMe);
      if (success) {
        toast({
          title: "Login Successful",
          description: "You have been logged in successfully!",
        });
        onClose();
        resetForm();
      } else {
        toast({
          title: "Verification Failed",
          description: "Invalid or expired one-time password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setVerificationCode("");
    setNeedsVerification(false);
    setVerificationEmail("");
    setShowForgotPassword(false);
    setForgotPasswordEmail("");
    setResetCode("");
    setNewPassword("");
    setShowResetPassword(false);
    setShowOtpLogin(false);
    setOtpEmail("");
    setOtpCode("");
    setRememberMe(false);
    setShowOtpVerification(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (needsVerification) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Your Email</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleVerifyEmail} className="space-y-4">
            <div>
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Check your email ({verificationEmail}) for the verification code.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Verify Email
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  if (showForgotPassword) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Your Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <Label htmlFor="forgot-email">Email Address</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="Enter your email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                We'll send you a reset code to this email address.
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowForgotPassword(false)}
              >
                Back to Login
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Send Reset Code
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  if (showOtpLogin) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Login with One-Time Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOtpLogin} className="space-y-4">
            <div>
              <Label htmlFor="otp-email">Email Address</Label>
              <Input
                id="otp-email"
                type="email"
                placeholder="Enter your email"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                We'll send you a one-time password to log in.
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowOtpLogin(false)}
              >
                Back to Login
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Send One-Time Password
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  if (showOtpVerification) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter One-Time Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <Label htmlFor="otp-code">One-Time Password</Label>
              <Input
                id="otp-code"
                type="text"
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Check your email ({otpEmail}) for the one-time password.
              </p>
            </div>
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox 
                id="otp-remember-me" 
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(!!checked)}
              />
              <Label htmlFor="otp-remember-me" className="text-sm">
                Remember me for 90 days
              </Label>
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowOtpVerification(false);
                  setShowOtpLogin(true);
                }}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Login
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  if (showResetPassword) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter New Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <Label htmlFor="reset-code">Reset Code</Label>
              <Input
                id="reset-code"
                type="text"
                placeholder="Enter 6-digit code"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                maxLength={6}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Check your email ({forgotPasswordEmail}) for the reset code.
              </p>
            </div>
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowResetPassword(false);
                  setShowForgotPassword(true);
                }}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Reset Password
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Login or Create Account</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox 
                  id="remember-me" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(!!checked)}
                />
                <Label htmlFor="remember-me" className="text-sm">
                  Remember me for 90 days
                </Label>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Login
              </Button>
              <div className="text-center space-x-4">
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setForgotPasswordEmail(email);
                  }}
                >
                  Forgot your password?
                </button>
                <span className="text-muted-foreground">•</span>
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                  onClick={() => {
                    setShowOtpLogin(true);
                    setOtpEmail(email);
                  }}
                >
                  Login with 1-time password
                </button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first-name">First Name</Label>
                  <Input
                    id="first-name"
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Create a password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Create Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}