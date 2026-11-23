import { DISTRICTS } from '@ehans/shared';

const SORTED = [...DISTRICTS].sort((a, b) => a.name.localeCompare(b.name));

/** The 64 districts (glowy's district picker); the choice sets the delivery charge. */
export function DistrictOptions() {
  return (
    <>
      <option value="">Select your district</option>
      {SORTED.map((d) => (
        <option key={d.key} value={d.key}>
          {d.name} — {d.bn}
        </option>
      ))}
    </>
  );
}
