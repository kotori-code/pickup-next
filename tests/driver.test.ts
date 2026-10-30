import { describe, expect, it } from "vitest";
import { driverLabel, isDriver, nextDriver } from "@/lib/driver";

describe("nextDriver", () => {
  it("未定のときに押すと光る", () => {
    expect(nextDriver(null, "papa")).toBe("papa");
  });

  it("光っている方をもう一度押すと消える", () => {
    expect(nextDriver("mama", "mama")).toBeNull();
  });

  it("もう一方を押すと入れ替わる", () => {
    expect(nextDriver("papa", "mama")).toBe("mama");
  });
});

describe("送る人の値", () => {
  it("papa と mama だけを受け付ける", () => {
    expect(isDriver("papa")).toBe(true);
    expect(isDriver("grandma")).toBe(false);
    expect(isDriver(null)).toBe(false);
  });

  it("表示名", () => {
    expect(driverLabel("papa")).toBe("パパ");
    expect(driverLabel(null)).toBe("未定");
  });
});
