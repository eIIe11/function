import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import Fork from "@/routes/Fork";

/**
 * Marketing and learner surfaces are split so a learner on a phone never
 * downloads the poster pages, and vice versa.
 */
const Workplace = lazy(() => import("@/routes/Workplace"));
const Yourself = lazy(() => import("@/routes/Yourself"));
const Membership = lazy(() => import("@/routes/Membership"));
const Intake = lazy(() => import("@/routes/Intake"));
const Learn = lazy(() => import("@/routes/Learn"));
const Unit = lazy(() => import("@/routes/Unit"));
const Tracker = lazy(() => import("@/routes/Tracker"));
const Troubleshoot = lazy(() => import("@/routes/Troubleshoot"));
const You = lazy(() => import("@/routes/You"));

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Fork />} />
        <Route element={<MarketingLayout />}>
          <Route path="/workplace" element={<Workplace />} />
          <Route path="/yourself" element={<Yourself />} />
          <Route path="/membership" element={<Membership />} />
        </Route>
        <Route path="/intake" element={<Intake />} />
        <Route element={<AppShell />}>
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:unitId" element={<Unit />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="/troubleshoot" element={<Troubleshoot />} />
          <Route path="/you" element={<You />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-paper">
      <span className="font-display text-2xl font-extrabold">
        FUNCTION<span className="animate-pulse text-acid">.</span>
      </span>
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto grid min-h-[100dvh] max-w-prose place-content-center px-5">
      <p className="label">404</p>
      <h1 className="setup mt-2 text-2xl">Nothing here.</h1>
      <p className="punchline mt-3">
        Nobody is coming to fix this link either. <a href="/" className="underline underline-offset-4">Start again</a>.
      </p>
    </div>
  );
}
