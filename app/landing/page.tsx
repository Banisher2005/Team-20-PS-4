"use client";

import React from "react";
import Link from "next/link";
import { DeskBotLogo } from "@/components/deskbot/deskbot-logo";
import { CrowdCanvas } from "@/components/ui/skiper39";
import {
  MessageSquare,
  Ticket,
  Shield,
  Zap,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  Bot,
} from "@/components/Icons";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen w-full bg-[#03120e] text-[#f4ffc7] font-sans selection:bg-[#7ce577]/30 selection:text-white">
      {/* Ambient Radial Glows */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(14, 124, 90, 0.45), transparent 70%), radial-gradient(circle 600px at 85% 60%, rgba(124, 229, 119, 0.12), transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* ============================================================
          TOP NAVIGATION
         ============================================================ */}
      <header className="sticky top-0 z-40 border-b border-[rgba(124,229,119,0.15)] bg-[#03120e]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(14,124,90,0.3)] border border-[rgba(124,229,119,0.25)] text-[#7ce577] shadow-inner transition-transform group-hover:scale-105">
              <DeskBotLogo className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                DeskBot
                <span className="rounded-full border border-[rgba(124,229,119,0.3)] bg-[rgba(14,124,90,0.3)] px-2 py-0.2 text-[10px] font-semibold text-[#7ce577]">
                  IT Helpdesk
                </span>
              </span>
            </div>
          </Link>

          {/* Minimal Nav Links */}
          <nav className="hidden items-center gap-8 text-sm font-medium text-emerald-200/80 md:flex">
            <a href="#overview" className="transition-colors hover:text-[#7ce577]">
              Overview
            </a>
            <a href="#features" className="transition-colors hover:text-[#7ce577]">
              Features
            </a>
            <a href="#workflow" className="transition-colors hover:text-[#7ce577]">
              How it Works
            </a>
            <span className="text-xs font-mono text-emerald-400/50">Zentrix Software</span>
          </nav>

          {/* Right CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#7ce577] px-4 py-2 text-xs font-bold text-[#03120e] shadow-sm transition-all hover:bg-[#91db79] hover:shadow-[0_0_15px_rgba(124,229,119,0.4)] active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================
          HERO SECTION WITH SKIPER 39 CROWD CANVAS
         ============================================================ */}
      <section
        id="overview"
        className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col justify-between overflow-hidden px-4 pt-12 pb-0 sm:px-6 sm:pt-16 lg:px-8"
      >
        {/* Hero Content (Layered safely above Crowd Canvas) */}
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          {/* Introductory Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(124,229,119,0.3)] bg-[rgba(14,124,90,0.25)] px-3.5 py-1 text-xs font-semibold tracking-wider uppercase text-[#7ce577] shadow-sm backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7ce577] animate-pulse" />
            YOUR PERSONAL IT HELPDESK
          </div>

          {/* Main Heading */}
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            IT Support, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#7ce577] via-[#f4ffc7] to-[#91db79] bg-clip-text text-transparent">
              Without the Wait.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-emerald-100/80 sm:text-lg md:text-xl">
            Meet DeskBot. Your intelligent IT helpdesk assistant, ready to troubleshoot, resolve and
            simplify your technical problems.
          </p>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-[#7ce577] px-6 py-3.5 text-sm font-bold text-[#03120e] shadow-lg shadow-emerald-950/40 transition-all hover:bg-[#91db79] hover:shadow-[0_0_25px_rgba(124,229,119,0.4)] active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(124,229,119,0.25)] bg-[rgba(14,124,90,0.2)] px-6 py-3.5 text-sm font-semibold text-[#f4ffc7] backdrop-blur-md transition-all hover:border-[rgba(124,229,119,0.45)] hover:bg-[rgba(14,124,90,0.35)]"
            >
              <span>Explore DeskBot</span>
              <ChevronDown className="h-4 w-4 text-[#7ce577]" />
            </a>
          </div>

          {/* Social Proof / Stats */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-emerald-200/70">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#7ce577]" />
              <span>30+ Verified KB Articles</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#7ce577]" />
              <span>Instant P1–P4 SLA Routing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#7ce577]" />
              <span>Zentrix Software IT Teams</span>
            </div>
          </div>
        </div>

        {/* ============================================================
            CROWD CANVAS CONTAINER (Skiper 39)
            Positioned along the bottom of the viewport
           ============================================================ */}
        <div className="relative mt-8 h-[340px] sm:h-[400px] md:h-[460px] w-full overflow-hidden pointer-events-none z-0">
          {/* Subtle Ground Fog / Gradient Fade at top so characters emerge naturally */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#03120e] to-transparent z-10" />

          {/* Soft ambient backlight behind walking characters */}
          <div
            className="absolute inset-x-0 bottom-0 h-44 opacity-25 z-0"
            style={{
              background:
                "radial-gradient(ellipse 90% 80% at 50% 100%, rgba(124, 229, 119, 0.45), transparent 70%)",
            }}
          />

          {/* Original Skiper 39 CrowdCanvas component */}
          <div className="absolute inset-0 w-full h-full">
            <CrowdCanvas src="/images/peeps/all-peeps.png" rows={15} cols={7} />
          </div>

          {/* Ground baseline */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-[rgba(124,229,119,0.15)] z-10" />
        </div>
      </section>

      {/* ============================================================
          FEATURES SECTION ("Explore DeskBot")
         ============================================================ */}
      <section id="features" className="relative z-10 border-t border-[rgba(124,229,119,0.15)] py-20 px-4 sm:px-6 lg:px-8 bg-[#031813]/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7ce577]">
              CORE CAPABILITIES
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Engineered to resolve IT issues immediately
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-emerald-100/70">
              DeskBot combines verified knowledge base fixes with automatic ticket categorization and SLA dispatching.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="gw-panel rounded-2xl border p-6 shadow-xl transition-transform hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(14,124,90,0.3)] border border-[rgba(124,229,119,0.25)] text-[#7ce577]">
                <Bot className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#f4ffc7]">
                Knowledge Base First
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-emerald-200/70">
                Instantly queries 30+ internal technical guides to provide verified steps for VPN, Cisco AnyConnect, Outlook, and password resets before logging a ticket.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="gw-panel rounded-2xl border p-6 shadow-xl transition-transform hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(14,124,90,0.3)] border border-[rgba(124,229,119,0.25)] text-[#7ce577]">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#f4ffc7]">
                Automated Ticketing
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-emerald-200/70">
                When an issue needs hands-on staff, DeskBot creates a ticket, determines category & priority (P1–P4), and assigns it to Network, Security, or Systems Support.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="gw-panel rounded-2xl border p-6 shadow-xl transition-transform hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(14,124,90,0.3)] border border-[rgba(124,229,119,0.25)] text-[#7ce577]">
                <Ticket className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#f4ffc7]">
                Real-Time Tracking
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-emerald-200/70">
                Live 5-second polling of ticket statuses, SLA response countdowns, and instant notification alerts when an IT engineer replies with an update.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="gw-panel rounded-2xl border p-6 shadow-xl transition-transform hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(14,124,90,0.3)] border border-[rgba(124,229,119,0.25)] text-[#7ce577]">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#f4ffc7]">
                Admin Incident Board
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-emerald-200/70">
                IT helpdesk admins monitor active queues, update statuses, inspect overdue SLAs, and generate automated AI incident summaries with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          WORKFLOW SECTION
         ============================================================ */}
      <section id="workflow" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7ce577]">
              HOW IT WORKS
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Three simple steps to resolution
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="relative rounded-2xl border border-[rgba(124,229,119,0.2)] bg-[rgba(14,124,90,0.15)] p-6 backdrop-blur-md">
              <div className="text-2xl font-black text-[#7ce577]">01</div>
              <h4 className="mt-2 text-base font-bold text-white">Describe Your Problem</h4>
              <p className="mt-2 text-xs text-emerald-200/70 leading-relaxed">
                Chat naturally with DeskBot about VPN drops, login issues, software licenses, or hardware errors.
              </p>
            </div>

            <div className="relative rounded-2xl border border-[rgba(124,229,119,0.2)] bg-[rgba(14,124,90,0.15)] p-6 backdrop-blur-md">
              <div className="text-2xl font-black text-[#7ce577]">02</div>
              <h4 className="mt-2 text-base font-bold text-white">Receive Instant Fixes</h4>
              <p className="mt-2 text-xs text-emerald-200/70 leading-relaxed">
                DeskBot immediately searches Zentrix's documentation and guides you through numbered troubleshooting steps.
              </p>
            </div>

            <div className="relative rounded-2xl border border-[rgba(124,229,119,0.2)] bg-[rgba(14,124,90,0.15)] p-6 backdrop-blur-md">
              <div className="text-2xl font-black text-[#7ce577]">03</div>
              <h4 className="mt-2 text-base font-bold text-white">Auto-Dispatched Ticket</h4>
              <p className="mt-2 text-xs text-emerald-200/70 leading-relaxed">
                If the fix doesn&apos;t resolve it, a ticket is logged with the correct priority and assigned directly to the responsible team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          CALL TO ACTION BANNER
         ============================================================ */}
      <section className="relative z-10 border-t border-[rgba(124,229,119,0.15)] py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#03120e] to-[#041a14]">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ready to resolve your IT issues?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-emerald-200/80">
            Launch DeskBot to experience instant knowledge retrieval and seamless ticket handling.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-[#7ce577] px-8 py-4 text-sm font-bold text-[#03120e] shadow-lg shadow-emerald-950/50 transition-all hover:bg-[#91db79] hover:shadow-[0_0_25px_rgba(124,229,119,0.5)] active:scale-95"
            >
              <span>Get Started with DeskBot</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          FOOTER
         ============================================================ */}
      <footer className="relative z-10 border-t border-[rgba(124,229,119,0.12)] py-8 px-4 text-center text-xs text-emerald-300/50 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <DeskBotLogo className="h-4 w-4" />
            <span className="font-semibold text-emerald-200/80">DeskBot</span>
            <span>· Zentrix Software IT Helpdesk</span>
          </div>
          <div>Internal Employee Support Portal · SRM Agentic AI Hackathon (PS4)</div>
        </div>
      </footer>
    </div>
  );
}
