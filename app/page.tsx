import { redirect } from "next/navigation";

export default function Home() {
  // TODO: サーバー側でセッションを確認し、ログイン済みなら /dashboard へ、
  // 未ログインなら /login へ振り分ける（Claude Codeでミドルウェアと合わせて実装）
  redirect("/login");
}
