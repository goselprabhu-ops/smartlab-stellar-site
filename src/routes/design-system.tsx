import { createFileRoute } from "@tanstack/react-router";
import {
  Brain, Sparkles, Target, Zap, BookOpen, Trophy, Users, Star,
  Check, X, AlertTriangle, Info, ChevronRight, Search, Bell, Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SectionHeading } from "@/components/SectionHeading";
import { GradientCard } from "@/components/ui/gradient-card";
import { StatCard } from "@/components/ui/stat-card";
import { KpiTile } from "@/components/ui/kpi-tile";

export const Route = createFileRoute("/design-system")({
  head: () => ({
    meta: [
      { title: "Design System · Smart Lab Online" },
      {
        name: "description",
        content:
          "The Smart Lab Online brand foundation — typography, palette, tokens, spacing, components, and motion principles for a premium AI-powered EdTech experience.",
      },
    ],
  }),
  component: DesignSystemPage,
});

/* ---------- helpers ---------- */

function Swatch({
  name, varName, hex, fg = "foreground",
}: { name: string; varName: string; hex?: string; fg?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card elev-2">
      <div
        className="flex h-20 items-end p-3 text-xs font-medium"
        style={{ background: `var(--${varName})`, color: `var(--${fg})` }}
      >
        {name}
      </div>
      <div className="space-y-0.5 p-3 text-[11px] text-muted-foreground">
        <div className="font-mono">--{varName}</div>
        {hex && <div className="font-mono opacity-70">{hex}</div>}
      </div>
    </div>
  );
}

function TokenRow({ label, value, sample }: { label: string; value: string; sample?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-3 last:border-0">
      <div>
        <div className="font-medium text-sm">{label}</div>
        <div className="font-mono text-[11px] text-muted-foreground">{value}</div>
      </div>
      {sample}
    </div>
  );
}

/* ---------- page ---------- */

function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Hero */}
      <header className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div className="bg-grid absolute inset-0 opacity-50" />
        <div className="container relative mx-auto max-w-6xl px-6 py-20">
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-2xl">
              <Badge className="mb-4 bg-white/10 text-white backdrop-blur">v1.0 · Brand Foundation</Badge>
              <h1 className="font-display text-5xl font-semibold tracking-tight text-white md:text-6xl">
                Smart Lab Online <span className="text-gradient bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">Design System</span>
              </h1>
              <p className="mt-4 max-w-xl text-lg text-white/75">
                A scalable, premium design language for AI-powered learning — built for clarity,
                trust, and delightful adaptive experiences across every Gosel product.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-xs">
                {["Modern", "Professional", "Intelligent", "Trustworthy", "Student-friendly"].map((t) => (
                  <span key={t} className="rounded-full border border-white/20 px-3 py-1 text-white/80">{t}</span>
                ))}
              </div>
            </div>
            <ThemeToggle className="bg-white/10 text-white hover:bg-white/20" />
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-6xl space-y-24 px-6 py-16">
        {/* BRAND IDENTITY */}
        <section>
          <SectionHeading eyebrow="01 · Identity" title="Brand Identity" description="Smart Lab Online is the flagship learning product of Gosel Global Holdings — an AI-first platform that makes mastery measurable for Classes 6–12." />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <GradientCard tone="brand" className="p-6 text-primary-foreground">
              <Brain className="mb-3 size-6" />
              <h3 className="font-display text-lg font-semibold">Intelligent</h3>
              <p className="mt-1 text-sm opacity-90">AI is not a feature — it's the substrate. Every interaction adapts to the learner.</p>
            </GradientCard>
            <GradientCard tone="soft" className="p-6">
              <Target className="mb-3 size-6 text-primary" />
              <h3 className="font-display text-lg font-semibold">Precise</h3>
              <p className="mt-1 text-sm text-muted-foreground">Mastery is tracked at the micro-concept level. Numbers are real, not vanity.</p>
            </GradientCard>
            <GradientCard tone="ink" className="p-6 text-white">
              <Sparkles className="mb-3 size-6 text-cyan-300" />
              <h3 className="font-display text-lg font-semibold">Premium</h3>
              <p className="mt-1 text-sm opacity-80">Investor-demo polish on every surface. Glass, gradients, and meaningful motion.</p>
            </GradientCard>
          </div>
        </section>

        {/* COLOR PALETTE */}
        <section>
          <SectionHeading eyebrow="02 · Color" title="Color Palette" description="Indigo + Cyan over Ink and Snow. Semantic tokens drive both light and dark themes from one source of truth." />

          <h3 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Brand</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Swatch name="Ink" varName="ink" hex="#0F172A" fg="snow" />
            <Swatch name="Blue" varName="blue" hex="#2563EB" fg="snow" />
            <Swatch name="Cyan" varName="cyan" hex="#06B6D4" fg="ink" />
            <Swatch name="Snow" varName="snow" hex="#F8FAFC" fg="ink" />
          </div>

          <h3 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Semantic</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Swatch name="Primary" varName="primary" fg="primary-foreground" />
            <Swatch name="Secondary" varName="secondary" fg="secondary-foreground" />
            <Swatch name="Accent" varName="accent" fg="accent-foreground" />
            <Swatch name="Muted" varName="muted" fg="muted-foreground" />
          </div>

          <h3 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">State</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Swatch name="Success" varName="success" fg="success-foreground" />
            <Swatch name="Warning" varName="warning" fg="warning-foreground" />
            <Swatch name="Info" varName="info" fg="info-foreground" />
            <Swatch name="Destructive" varName="destructive" fg="destructive-foreground" />
          </div>

          <h3 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Mastery scale</h3>
          <div className="grid grid-cols-3 gap-3">
            <Swatch name="Low" varName="mastery-low" fg="snow" />
            <Swatch name="Mid" varName="mastery-mid" fg="ink" />
            <Swatch name="High" varName="mastery-high" fg="snow" />
          </div>

          <h3 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Gradients</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="bg-gradient-brand flex h-24 items-end rounded-xl p-3 text-xs font-medium text-white">--gradient-brand</div>
            <div className="bg-gradient-hero flex h-24 items-end rounded-xl p-3 text-xs font-medium text-white">--gradient-hero</div>
            <div className="bg-gradient-soft flex h-24 items-end rounded-xl p-3 text-xs font-medium text-foreground">--gradient-soft</div>
          </div>
        </section>

        {/* TYPOGRAPHY */}
        <section>
          <SectionHeading eyebrow="03 · Type" title="Typography" description="Satoshi for display, Inter for body. Tight tracking, balanced wrap, ligatures on." />
          <Card className="mt-8 elev-3">
            <CardContent className="space-y-6 p-8">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Display · Satoshi · 600</p>
                <h1 className="font-display text-6xl font-semibold tracking-tight">Mastery, measured.</h1>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">H1 · 48 / 1.1</p>
                <h2 className="font-display text-5xl font-semibold tracking-tight">Adaptive learning, beautifully done.</h2>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">H2 · 36 / 1.15</p>
                <h3 className="font-display text-4xl font-semibold tracking-tight">Built for Classes 6–12.</h3>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">H3 · 24 / 1.25</p>
                <h4 className="font-display text-2xl font-semibold">Smart revision, on schedule.</h4>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Body · Inter · 16 / 1.6</p>
                <p className="max-w-2xl text-base leading-relaxed">
                  Smart Lab Online turns every study session into measurable progress. The platform listens, adapts,
                  and surfaces the exact concept a student needs next — no more guessing.
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Caption · 12 / 1.5</p>
                <p className="text-xs text-muted-foreground">Used for metadata, tooltips, and dense data tables.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SPACING + RADIUS + SHADOWS */}
        <section>
          <SectionHeading eyebrow="04 · Tokens" title="Spacing, Radius & Elevation" description="A 4pt grid, fluid radius scale, and 5 levels of elevation tuned for both themes." />

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <Card className="elev-2">
              <CardHeader><CardTitle className="text-base">Spacing scale</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {[1, 2, 3, 4, 6, 8, 12, 16].map((s) => (
                  <div key={s} className="flex items-center gap-3">
                    <div className="w-10 font-mono text-xs text-muted-foreground">{s * 4}px</div>
                    <div className="bg-primary h-3 rounded" style={{ width: `${s * 8}px` }} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="elev-2">
              <CardHeader><CardTitle className="text-base">Border radius</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-3">
                {[
                  ["sm", "rounded-sm"],
                  ["md", "rounded-md"],
                  ["lg", "rounded-lg"],
                  ["xl", "rounded-xl"],
                  ["2xl", "rounded-2xl"],
                  ["full", "rounded-full"],
                ].map(([label, cls]) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <div className={`bg-gradient-brand h-14 w-14 ${cls}`} />
                    <span className="font-mono text-[10px] text-muted-foreground">{label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="elev-2">
              <CardHeader><CardTitle className="text-base">Elevation</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className={`flex items-center justify-between rounded-lg bg-card px-4 py-3 elev-${n}`}>
                    <span className="text-sm">Level {n}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">--shadow-{["xs","sm","md","lg","xl"][n-1]}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* BUTTONS */}
        <section>
          <SectionHeading eyebrow="05 · Buttons" title="Button Styles" description="Six variants, four sizes. Always paired with a clear label or icon." />
          <Card className="mt-8 elev-2">
            <CardContent className="space-y-6 p-8">
              <div className="flex flex-wrap gap-3">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon" aria-label="Search"><Search className="size-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button className="bg-gradient-brand text-primary-foreground shadow-glow">
                  <Sparkles className="size-4" /> Ask AI
                </Button>
                <Button variant="outline"><Bell className="size-4" /> Notify me</Button>
                <Button disabled>Disabled</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FORM CONTROLS */}
        <section>
          <SectionHeading eyebrow="06 · Forms" title="Form & Input Styles" description="Accessible, focus-ringed, and consistent across light and dark themes." />
          <Card className="mt-8 elev-2">
            <CardContent className="grid gap-6 p-8 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ds-email">Email</Label>
                <Input id="ds-email" type="email" placeholder="student@school.edu" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ds-pass">Password</Label>
                <Input id="ds-pass" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ds-bio">About</Label>
                <Textarea id="ds-bio" placeholder="Tell us about your learning goals…" rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Pick your class" /></SelectTrigger>
                  <SelectContent>
                    {[6, 7, 8, 9, 10, 11, 12].map((c) => (
                      <SelectItem key={c} value={String(c)}>Class {c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox id="ds-c" defaultChecked /><Label htmlFor="ds-c">Daily reminders</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="ds-s" defaultChecked /><Label htmlFor="ds-s">AI nudges</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CARDS */}
        <section>
          <SectionHeading eyebrow="07 · Cards" title="Card Styles" description="Surface containers — from neutral data cards to premium gradient hero tiles." />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Card className="elev-2 hover-lift">
              <CardHeader>
                <CardTitle>Standard Card</CardTitle>
                <CardDescription>Default surface with subtle elevation.</CardDescription>
              </CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">Use for lists, tables, settings.</p></CardContent>
            </Card>
            <GradientCard tone="brand" className="p-6 text-primary-foreground">
              <h3 className="font-display text-lg font-semibold">Gradient Card</h3>
              <p className="mt-1 text-sm opacity-90">For highlighted CTAs and AI features.</p>
            </GradientCard>
            <div className="glass rounded-xl p-6">
              <h3 className="font-display text-lg font-semibold">Glass Card</h3>
              <p className="mt-1 text-sm text-muted-foreground">Backdrop-blur over hero backgrounds.</p>
            </div>
          </div>

          <h3 className="mt-10 mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Data tiles</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Mastery" value="78%" trend="up" hint="+6% this week" icon={<Trophy className="size-4" />} />
            <StatCard label="Streak" value="12d" trend="up" hint="Personal best" icon={<Zap className="size-4" />} />
            <StatCard label="Due now" value="4" trend="down" hint="-2 since yesterday" icon={<Bell className="size-4" />} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <KpiTile label="Concepts mastered" value="142" caption="Across 6 subjects" accent="primary" icon={<BookOpen className="size-4" />} />
            <KpiTile label="Quizzes taken" value="38" caption="Last 30 days" accent="accent" icon={<Star className="size-4" />} />
            <KpiTile label="Active learners" value="2.4k" caption="Today" accent="success" icon={<Users className="size-4" />} />
          </div>
        </section>

        {/* FEEDBACK / STATES */}
        <section>
          <SectionHeading eyebrow="08 · States" title="Feedback States" description="Color-coded badges and alerts for system messaging." />
          <Card className="mt-8 elev-2">
            <CardContent className="space-y-6 p-8">
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge className="bg-success text-success-foreground"><Check className="size-3" /> Success</Badge>
                <Badge className="bg-warning text-warning-foreground"><AlertTriangle className="size-3" /> Warning</Badge>
                <Badge className="bg-info text-info-foreground"><Info className="size-3" /> Info</Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm"><Progress value={28} className="flex-1" /><span className="w-10 font-mono text-xs text-muted-foreground">28%</span></div>
                <div className="flex items-center gap-2 text-sm"><Progress value={64} className="flex-1" /><span className="w-10 font-mono text-xs text-muted-foreground">64%</span></div>
                <div className="flex items-center gap-2 text-sm"><Progress value={92} className="flex-1" /><span className="w-10 font-mono text-xs text-muted-foreground">92%</span></div>
              </div>

              <Tabs defaultValue="a">
                <TabsList>
                  <TabsTrigger value="a">Overview</TabsTrigger>
                  <TabsTrigger value="b">Mastery</TabsTrigger>
                  <TabsTrigger value="c">Retention</TabsTrigger>
                </TabsList>
                <TabsContent value="a" className="pt-3 text-sm text-muted-foreground">Tabs use the same focus ring + radius tokens as inputs.</TabsContent>
                <TabsContent value="b" className="pt-3 text-sm text-muted-foreground">Mastery breakdown view.</TabsContent>
                <TabsContent value="c" className="pt-3 text-sm text-muted-foreground">Retention curve view.</TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        {/* ICONOGRAPHY */}
        <section>
          <SectionHeading eyebrow="09 · Iconography" title="Icon Style" description="Lucide icons, 1.75 stroke, 16/20/24 sizing. Always paired with a label for accessibility." />
          <Card className="mt-8 elev-2">
            <CardContent className="grid grid-cols-4 gap-4 p-8 md:grid-cols-8">
              {[Brain, Sparkles, Target, Zap, BookOpen, Trophy, Users, Star, Check, X, AlertTriangle, Info, ChevronRight, Search, Bell, Heart].map((Icon, i) => (
                <div key={i} className="flex flex-col items-center gap-1 rounded-lg border bg-card p-3 elev-1">
                  <Icon className="size-5 text-primary" />
                  <span className="font-mono text-[9px] text-muted-foreground">{Icon.displayName ?? "icon"}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* MOTION */}
        <section>
          <SectionHeading eyebrow="10 · Motion" title="Animation Guidelines" description="Movement is intentional. Use it to guide attention, never to decorate." />
          <Card className="mt-8 elev-2">
            <CardContent className="space-y-4 p-8">
              <TokenRow label="Fast — micro interactions" value="--duration-fast · 150ms" sample={<div className="bg-primary h-6 w-24 rounded transition-all hover:w-32" />} />
              <TokenRow label="Base — UI transitions" value="--duration-base · 240ms" sample={<div className="hover-lift bg-card border rounded-lg px-4 py-2 text-xs">Hover me</div>} />
              <TokenRow label="Slow — entrances" value="--duration-slow · 420ms" sample={<div className="animate-fade-in bg-gradient-brand h-6 w-24 rounded text-xs" />} />
              <TokenRow label="Easing — out-soft" value="cubic-bezier(0.22, 1, 0.36, 1)" />
              <TokenRow label="Easing — spring" value="cubic-bezier(0.34, 1.56, 0.64, 1)" />
              <TokenRow label="Brand animated gradient" value=".bg-gradient-animated · 12s loop" sample={<div className="bg-gradient-animated h-6 w-24 rounded" />} />
            </CardContent>
          </Card>
        </section>

        {/* THEME PREVIEW */}
        <section>
          <SectionHeading eyebrow="11 · Themes" title="Light & Dark Theme" description="Both themes share the same token graph. Toggle in the hero or via the system preference." />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border bg-snow elev-3">
              <div className="border-b px-4 py-2 text-xs font-medium text-ink">Light theme</div>
              <div className="space-y-3 bg-[oklch(0.97_0.008_250)] p-6 text-[oklch(0.18_0.045_265)]">
                <h4 className="font-display text-xl font-semibold">Mastery, measured.</h4>
                <p className="text-sm opacity-80">AI surfaces exactly what to study next.</p>
                <button className="bg-[oklch(0.56_0.22_264)] rounded-full px-4 py-2 text-xs font-medium text-white">Continue learning</button>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border elev-3" style={{ background: "oklch(0.21 0.04 265)" }}>
              <div className="border-b border-white/10 px-4 py-2 text-xs font-medium text-white/80">Dark theme</div>
              <div className="space-y-3 p-6 text-white" style={{ background: "oklch(0.18 0.04 265)" }}>
                <h4 className="font-display text-xl font-semibold">Mastery, measured.</h4>
                <p className="text-sm opacity-80">AI surfaces exactly what to study next.</p>
                <button className="bg-gradient-brand rounded-full px-4 py-2 text-xs font-medium text-white shadow-glow">Continue learning</button>
              </div>
            </div>
          </div>
        </section>

        {/* USAGE NOTES */}
        <section>
          <SectionHeading eyebrow="12 · Usage" title="Engineering Notes" description="Everything is wired through CSS variables in src/styles.css and exposed to Tailwind via @theme inline." />
          <Card className="mt-8 elev-2">
            <CardContent className="space-y-2 p-8 font-mono text-xs">
              <div><span className="text-muted-foreground">// Always prefer semantic tokens</span></div>
              <div>className="bg-primary text-primary-foreground rounded-xl elev-3 hover-lift"</div>
              <div className="mt-3"><span className="text-muted-foreground">// Never hard-code colors</span></div>
              <div className="text-destructive">className="bg-[#2563EB] text-white"  ← avoid</div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
