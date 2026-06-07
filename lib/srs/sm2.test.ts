import { describe, it, expect } from "vitest";
import { initReview, scheduleReview, isDue, dueReviews, MIN_EASE } from "@/lib/srs/sm2";

const TODAY = "2026-06-07";

describe("SM-2 scheduler", () => {
  it("a new card is due immediately", () => {
    const s = initReview("c1", "unit-1", TODAY);
    expect(isDue(s, TODAY)).toBe(true);
    expect(s.intervalDays).toBe(0);
  });

  it("'good' grows the interval 1 → 6 → ~15 days", () => {
    let s = initReview("c1", "unit-1", TODAY);
    s = scheduleReview(s, "good", TODAY); // rep 1
    expect(s.intervalDays).toBe(1);
    expect(s.dueLocalDate).toBe("2026-06-08");
    s = scheduleReview(s, "good", TODAY); // rep 2
    expect(s.intervalDays).toBe(6);
    s = scheduleReview(s, "good", TODAY); // rep 3 = round(6 * 2.5)
    expect(s.intervalDays).toBe(15);
  });

  it("'again' is a lapse — resets repetitions and interval", () => {
    let s = initReview("c1", "unit-1", TODAY);
    s = scheduleReview(s, "good", TODAY);
    s = scheduleReview(s, "good", TODAY);
    const before = s.lapses;
    s = scheduleReview(s, "again", TODAY);
    expect(s.repetitions).toBe(0);
    expect(s.intervalDays).toBe(1);
    expect(s.lapses).toBe(before + 1);
  });

  it("ease never drops below 1.3", () => {
    let s = initReview("c1", "unit-1", TODAY);
    for (let i = 0; i < 20; i += 1) s = scheduleReview(s, "again", TODAY);
    expect(s.ease).toBeGreaterThanOrEqual(MIN_EASE);
  });

  it("'easy' raises ease above the start", () => {
    let s = initReview("c1", "unit-1", TODAY);
    s = scheduleReview(s, "easy", TODAY);
    expect(s.ease).toBeGreaterThan(2.5);
  });

  it("dueReviews returns only due cards, soonest first", () => {
    const a = { ...initReview("a", "unit-1", TODAY), dueLocalDate: "2026-06-05" };
    const b = { ...initReview("b", "unit-1", TODAY), dueLocalDate: "2026-06-07" };
    const c = { ...initReview("c", "unit-1", TODAY), dueLocalDate: "2026-06-20" };
    const due = dueReviews({ a, b, c }, TODAY);
    expect(due.map((r) => r.cardId)).toEqual(["a", "b"]);
  });
});
