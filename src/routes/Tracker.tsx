import { Link } from "react-router-dom";
import { useApp } from "@/store/app";
import { Button } from "@/components/ui/Button";

const DAY = 86_400_000;
/** §12.2 Four check-ins across 30 days, then the commitment ends. */
const CHECK_IN_DAYS = [3, 7, 14, 30];

export default function Tracker() {
  const commitments = useApp((s) => s.commitments);
  const checkIn = useApp((s) => s.checkIn);

  if (commitments.length === 0) {
    return (
      <div>
        <h1 className="setup text-xl">Tracker</h1>
        <p className="punchline mt-3">
          Nothing here yet. Commitments come from the end of a unit — one cue, one behaviour, thirty
          days, and then it's over.
        </p>
        <Link to="/learn" className="mt-5 block">
          <Button full>Go and finish a unit</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="setup text-xl">Tracker</h1>
      <p className="punchline mt-2">
        No streaks. Missing one changes nothing except the honesty of the record.
      </p>

      <ul className="mt-5 space-y-3">
        {commitments.map((commitment) => {
          const dayNumber = Math.floor((Date.now() - commitment.startedAt) / DAY) + 1;
          const finished = dayNumber > 30;
          const due = CHECK_IN_DAYS.filter((d) => d <= dayNumber).length;
          const outstanding = due - commitment.checkIns.length;
          return (
            <li key={commitment.id} className="q-card p-4">
              <p className="label">Cue</p>
              <p className="mt-0.5 text-md">{commitment.cue}</p>
              <p className="label mt-3">Behaviour</p>
              <p className="mt-0.5 text-md">{commitment.behaviour}</p>

              <div className="mt-4 flex items-center gap-2" aria-hidden="true">
                {CHECK_IN_DAYS.map((day, i) => (
                  <span
                    key={day}
                    className="h-2 flex-1 rounded-full"
                    style={{
                      background:
                        i < commitment.checkIns.length ? "var(--accent)" : "var(--track)",
                    }}
                  />
                ))}
              </div>
              <p className="label mt-2">
                {finished ? "Finished" : `Day ${dayNumber} of 30`} ·{" "}
                {commitment.checkIns.length} of 4 check-ins
              </p>

              {outstanding > 0 && !finished && (
                <Button full className="mt-4" onClick={() => checkIn(commitment.id)}>
                  Check in for day {CHECK_IN_DAYS[commitment.checkIns.length]}
                </Button>
              )}
              {finished && (
                <p className="mt-3 text-sm text-muted">
                  Thirty days done. Whether it stuck is a separate question from whether you ticked
                  the boxes.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
