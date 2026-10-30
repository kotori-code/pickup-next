// 送る人（パパ/ママ）。1 日に 1 人、または未定（null）

export const DRIVERS = [
  { value: "papa", label: "パパ" },
  { value: "mama", label: "ママ" },
] as const;

export type Driver = (typeof DRIVERS)[number]["value"];

export function isDriver(value: unknown): value is Driver {
  return DRIVERS.some((driver) => driver.value === value);
}

export function driverLabel(driver: Driver | null): string {
  return DRIVERS.find((item) => item.value === driver)?.label ?? "未定";
}

/** ボタンを押したあとの送る人。光っている方をもう一度押すと未定に戻る */
export function nextDriver(
  current: Driver | null,
  pressed: Driver,
): Driver | null {
  return current === pressed ? null : pressed;
}
