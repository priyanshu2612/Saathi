// Hand-maintained social proof for the Saathi application page. Only list
// people who have agreed to be shown, and keep both numbers true — update
// them as they change.

/** Shown as "{value} people registered as a Saathi in the last 24 hours". */
export const REGISTERED_LAST_24H = "40+";

export interface RecentSaathi {
  firstName: string;
  age: number;
  city: string;
  /** Weekday they registered, e.g. "Monday". Leave out if unknown — the line then says "recently". */
  day?: string;
}

export const RECENT_SAATHIS: RecentSaathi[] = [
  { firstName: "Arti", age: 22, city: "Haryana" },
  { firstName: "Soumya", age: 20, city: "Nainital" },
  { firstName: "Megha", age: 26, city: "Ujjain" },
  { firstName: "Divya", age: 26, city: "Nagpur" },
  { firstName: "Priya", age: 23, city: "Delhi" },
  { firstName: "Kavya", age: 20, city: "Kolkata" },
  { firstName: "Komal", age: 28, city: "Himatnagar" },
  { firstName: "Lovely", age: 20, city: "Delhi" },
  { firstName: "Suman", age: 39, city: "Lucknow" },
  { firstName: "Jasleen", age: 29, city: "Ranchi" },
];
