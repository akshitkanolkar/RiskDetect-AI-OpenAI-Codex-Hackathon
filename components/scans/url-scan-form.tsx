"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link2, Loader2, ShieldAlert } from "lucide-react";
import { urlScanSchema, type UrlScanInput } from "@/lib/validations/scan";
import { useUrlScan } from "@/hooks/use-scans";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";

export function UrlScanForm() {
  const router = useRouter();
  const { toast } = useToast();
  const scan = useUrlScan();
  const [progress, setProgress] = useState(0);

  const form = useForm<UrlScanInput>({
    resolver: zodResolver(urlScanSchema),
    defaultValues: { url: "" },
  });

  const onSubmit = async (values: UrlScanInput) => {
    setProgress(12);
    const timer = setInterval(() => {
      setProgress((p) => Math.min(90, p + 8));
    }, 280);

    try {
      const result = await scan.mutateAsync(values.url);
      setProgress(100);
      toast({
        title: "Scan complete",
        description: `${result.domain} scored ${result.risk_score}/100 (${result.risk_level}).`,
      });
      router.push(`${ROUTES.SCAN_DETAIL(result.id)}?type=url`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Scan failed",
        description: error instanceof Error ? error.message : "Unable to scan URL",
      });
    } finally {
      clearInterval(timer);
      setTimeout(() => setProgress(0), 600);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 md:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Link2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-card-title">Analyze a URL</h2>
          <p className="text-caption">
            We check protocol, domain structure, phishing keywords, and public threat feeds.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://amaz0n-security-login.xyz"
                    autoComplete="off"
                    inputMode="url"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {progress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldAlert className="h-3.5 w-3.5 text-brand" />
                Running heuristics, threat feeds, and AI synthesis…
              </div>
              <Progress value={progress} />
            </div>
          )}

          <Button
            type="submit"
            variant="brand"
            className="w-full sm:w-auto"
            disabled={scan.isPending}
          >
            {scan.isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Scanning…
              </>
            ) : (
              "Scan URL"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
