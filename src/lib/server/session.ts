import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  isValidSession,
  MEMBER_COOKIE,
  normalizeMember,
  SESSION_COOKIE,
} from "@/lib/auth";

/** 合言葉の Cookie を確かめ、名前を返す。Server Actions の最初に呼ぶ（proxy を通らない呼び出しにも備える） */
export async function requireMember(): Promise<string> {
  const store = await cookies();
  if (
    !(await isValidSession(
      store.get(SESSION_COOKIE)?.value,
      process.env.APP_PASSWORD,
    ))
  )
    redirect("/login");
  const member = normalizeMember(store.get(MEMBER_COOKIE)?.value);
  if (!member) redirect("/name");
  return member;
}

/** 今の名前（画面に出す用） */
export async function currentMember(): Promise<string | null> {
  return normalizeMember((await cookies()).get(MEMBER_COOKIE)?.value);
}
