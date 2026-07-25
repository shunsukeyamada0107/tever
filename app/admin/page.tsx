"use client";

import { useEffect, useState } from "react";

type StoreRow = {
  id: string;
  name: string;
  plan: string;
  organization_id: string | null;
  created_at: string;
};

type OrganizationRow = {
  id: string;
  name: string;
  created_at: string;
  stores: { id: string; name: string }[];
  loginEmail: string | null;
};

const PLAN_LABELS: Record<string, string> = {
  trial: "お試し中",
  paid: "有料（支払い済み）",
  suspended: "停止中",
};

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export default function AdminPage() {
  const [stores, setStores] = useState<StoreRow[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(generatePassword());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ storeName: string; ownerEmail: string; password: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [enteringId, setEnteringId] = useState<string | null>(null);
  const [enterError, setEnterError] = useState<string | null>(null);
  const [updatingPlanId, setUpdatingPlanId] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [updatingOrgStoreId, setUpdatingOrgStoreId] = useState<string | null>(null);
  const [orgAssignError, setOrgAssignError] = useState<string | null>(null);

  const [organizations, setOrganizations] = useState<OrganizationRow[] | null>(null);
  const [orgListError, setOrgListError] = useState<string | null>(null);
  const [newOrgName, setNewOrgName] = useState("");
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [orgFormError, setOrgFormError] = useState<string | null>(null);
  const [deletingOrgId, setDeletingOrgId] = useState<string | null>(null);
  const [orgDeleteError, setOrgDeleteError] = useState<string | null>(null);
  const [loginFormOrgId, setLoginFormOrgId] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState(generatePassword());
  const [creatingLogin, setCreatingLogin] = useState(false);
  const [loginFormError, setLoginFormError] = useState<string | null>(null);
  const [createdLogin, setCreatedLogin] = useState<{ organizationName: string; loginEmail: string; password: string } | null>(
    null
  );

  async function loadStores() {
    setListError(null);
    const res = await fetch("/api/admin/stores");
    const body = await res.json();
    if (!res.ok) {
      setListError(body.error ?? "店舗一覧の取得に失敗しました。");
      return;
    }
    setStores(body.stores);
  }

  async function loadOrganizations() {
    setOrgListError(null);
    const res = await fetch("/api/admin/organizations");
    const body = await res.json();
    if (!res.ok) {
      setOrgListError(body.error ?? "組織一覧の取得に失敗しました。");
      return;
    }
    setOrganizations(body.organizations);
  }

  useEffect(() => {
    loadStores();
    loadOrganizations();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setCreated(null);

    const res = await fetch("/api/admin/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeName, email, password }),
    });
    const body = await res.json();

    setSubmitting(false);

    if (!res.ok) {
      setFormError(body.error ?? "作成に失敗しました。");
      return;
    }

    setCreated({ storeName: body.storeName, ownerEmail: body.ownerEmail, password });
    setStoreName("");
    setEmail("");
    setPassword(generatePassword());
    loadStores();
  }

  async function handleDelete(store: StoreRow) {
    const confirmed = window.confirm(
      `「${store.name}」を完全に削除します。\n伝票・経費・スタッフなどの全データと、オーナーのログインアカウントも削除され、元に戻せません。\n本当に削除しますか？`
    );
    if (!confirmed) return;

    setDeleteError(null);
    setDeletingId(store.id);

    const res = await fetch(`/api/admin/stores/${store.id}`, { method: "DELETE" });
    const body = await res.json();

    setDeletingId(null);

    if (!res.ok) {
      setDeleteError(body.error ?? "削除に失敗しました。");
      return;
    }

    loadStores();
  }

  async function handleEnter(store: StoreRow) {
    const confirmed = window.confirm(
      `「${store.name}」のオーナーとしてログインし直します。運営アカウントとしてのログインは切れます。よろしいですか？`
    );
    if (!confirmed) return;

    setEnterError(null);
    setEnteringId(store.id);

    const res = await fetch(`/api/admin/stores/${store.id}/enter`, { method: "POST" });
    const body = await res.json();

    if (!res.ok) {
      setEnteringId(null);
      setEnterError(body.error ?? "入れませんでした。");
      return;
    }

    window.location.href = body.url;
  }

  async function handlePlanChange(store: StoreRow, plan: string) {
    setPlanError(null);
    setUpdatingPlanId(store.id);

    const res = await fetch(`/api/admin/stores/${store.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const body = await res.json();

    setUpdatingPlanId(null);

    if (!res.ok) {
      setPlanError(body.error ?? "プランの変更に失敗しました。");
      return;
    }

    loadStores();
  }

  async function handleAssignOrg(store: StoreRow, organizationId: string) {
    setOrgAssignError(null);
    setUpdatingOrgStoreId(store.id);

    const res = await fetch(`/api/admin/stores/${store.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: organizationId || null }),
    });
    const body = await res.json();

    setUpdatingOrgStoreId(null);

    if (!res.ok) {
      setOrgAssignError(body.error ?? "組織の割り当てに失敗しました。");
      return;
    }

    loadStores();
    loadOrganizations();
  }

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    setCreatingOrg(true);
    setOrgFormError(null);

    const res = await fetch("/api/admin/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newOrgName }),
    });
    const body = await res.json();

    setCreatingOrg(false);

    if (!res.ok) {
      setOrgFormError(body.error ?? "作成に失敗しました。");
      return;
    }

    setNewOrgName("");
    loadOrganizations();
  }

  async function handleDeleteOrg(org: OrganizationRow) {
    const confirmed = window.confirm(
      `「${org.name}」を削除します。\n本部ログインアカウントも削除されます（所属店舗自体は削除されません）。\n本当に削除しますか？`
    );
    if (!confirmed) return;

    setOrgDeleteError(null);
    setDeletingOrgId(org.id);

    const res = await fetch(`/api/admin/organizations/${org.id}`, { method: "DELETE" });
    const body = await res.json();

    setDeletingOrgId(null);

    if (!res.ok) {
      setOrgDeleteError(body.error ?? "削除に失敗しました。");
      return;
    }

    loadOrganizations();
    loadStores();
  }

  function openLoginForm(orgId: string) {
    setLoginFormOrgId(orgId);
    setLoginEmail("");
    setLoginPassword(generatePassword());
    setLoginFormError(null);
  }

  async function handleCreateLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginFormOrgId) return;
    setCreatingLogin(true);
    setLoginFormError(null);
    setCreatedLogin(null);

    const res = await fetch(`/api/admin/organizations/${loginFormOrgId}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginEmail, password: loginPassword }),
    });
    const body = await res.json();

    setCreatingLogin(false);

    if (!res.ok) {
      setLoginFormError(body.error ?? "作成に失敗しました。");
      return;
    }

    setCreatedLogin({ organizationName: body.organizationName, loginEmail: body.loginEmail, password: loginPassword });
    setLoginFormOrgId(null);
    loadOrganizations();
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-lg mx-auto space-y-8">
      <h1 className="text-gold text-lg font-bold">店舗管理（運営用）</h1>

      <form onSubmit={handleCreate} className="bg-bg2 border border-line rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-200">新しい店舗を作成</h2>
        <div>
          <label className="block text-xs text-gray-400 mb-1">店舗名</label>
          <input
            type="text"
            required
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="w-full rounded-md bg-bg border border-line px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">オーナーのメールアドレス</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md bg-bg border border-line px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">初期パスワード</label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 rounded-md bg-bg border border-line px-3 py-2 font-mono"
            />
            <button
              type="button"
              onClick={() => setPassword(generatePassword())}
              className="text-xs text-gray-400 border border-line rounded-md px-3"
            >
              再生成
            </button>
          </div>
        </div>
        {formError && <p className="text-rose text-sm">{formError}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-gold text-bg font-bold py-2 disabled:opacity-50"
        >
          {submitting ? "作成中..." : "店舗を作成する"}
        </button>
      </form>

      {created && (
        <div className="bg-bg2 border border-gold rounded-xl p-4 space-y-1 text-sm">
          <p className="text-gold font-bold">作成しました</p>
          <p>店舗名: {created.storeName}</p>
          <p>ログイン用メール: {created.ownerEmail}</p>
          <p>
            初期パスワード: <span className="font-mono">{created.password}</span>
          </p>
          <p className="text-xs text-gray-500">このパスワードは今だけ表示されます。店舗オーナーに伝えてください。</p>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-bold text-gray-200">登録済みの店舗</h2>
        {listError && <p className="text-rose text-sm">{listError}</p>}
        {deleteError && <p className="text-rose text-sm">{deleteError}</p>}
        {enterError && <p className="text-rose text-sm">{enterError}</p>}
        {planError && <p className="text-rose text-sm">{planError}</p>}
        {stores && stores.length > 0 && (
          <p className="text-xs text-gray-500">
            「入る」を押すとその店舗のオーナーとしてログインし直されます。運営アカウントに戻るには、一度ログアウトして自分のメールで再ログインしてください。
          </p>
        )}
        {!stores && !listError && <p className="text-xs text-gray-500">読み込み中...</p>}
        {stores && stores.length === 0 && <p className="text-xs text-gray-500">まだ店舗がありません。</p>}
        {stores && stores.length > 0 && (
          <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden">
            {stores.map((s) => (
              <li key={s.id} className="px-4 py-3 bg-bg2 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold">{s.name}</div>
                    <div className="text-xs text-gray-500">{new Date(s.created_at).toLocaleDateString("ja-JP")}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEnter(s)}
                      disabled={enteringId === s.id}
                      className="text-xs text-gold border border-gold/50 rounded-md px-2 py-1 disabled:opacity-50"
                    >
                      {enteringId === s.id ? "移動中..." : "入る"}
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      disabled={deletingId === s.id}
                      className="text-xs text-rose border border-rose/50 rounded-md px-2 py-1 disabled:opacity-50"
                    >
                      {deletingId === s.id ? "削除中..." : "削除"}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">状態</span>
                  <select
                    value={s.plan}
                    onChange={(e) => handlePlanChange(s, e.target.value)}
                    disabled={updatingPlanId === s.id}
                    className="text-xs rounded-md bg-bg border border-line px-2 py-1 disabled:opacity-50"
                  >
                    {Object.entries(PLAN_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                {organizations && organizations.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">組織</span>
                    <select
                      value={s.organization_id ?? ""}
                      onChange={(e) => handleAssignOrg(s, e.target.value)}
                      disabled={updatingOrgStoreId === s.id}
                      className="text-xs rounded-md bg-bg border border-line px-2 py-1 disabled:opacity-50"
                    >
                      <option value="">未所属</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {orgAssignError && <p className="text-rose text-sm">{orgAssignError}</p>}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-bold text-gray-200">組織（複数店舗の一括管理）</h2>
        <p className="text-xs text-gray-500">
          複数店舗を運営するお客様向けに、全店舗の売上をまとめて見られる本部アカウントを発行できます。
        </p>

        <form onSubmit={handleCreateOrg} className="bg-bg2 border border-line rounded-xl p-4 flex gap-2">
          <input
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            placeholder="組織名（例：〇〇グループ）"
            required
            className="flex-1 min-w-0 rounded-md bg-bg border border-line px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={creatingOrg}
            className="rounded-md bg-gold text-bg px-3 py-2 text-sm font-bold disabled:opacity-50 shrink-0"
          >
            {creatingOrg ? "作成中..." : "＋ 追加"}
          </button>
        </form>
        {orgFormError && <p className="text-rose text-sm">{orgFormError}</p>}

        {createdLogin && (
          <div className="bg-bg2 border border-gold rounded-xl p-4 space-y-1 text-sm">
            <p className="text-gold font-bold">本部アカウントを作成しました</p>
            <p>組織名: {createdLogin.organizationName}</p>
            <p>ログイン用メール: {createdLogin.loginEmail}</p>
            <p>
              初期パスワード: <span className="font-mono">{createdLogin.password}</span>
            </p>
            <p className="text-xs text-gray-500">このパスワードは今だけ表示されます。組織の担当者に伝えてください。</p>
          </div>
        )}

        {orgListError && <p className="text-rose text-sm">{orgListError}</p>}
        {orgDeleteError && <p className="text-rose text-sm">{orgDeleteError}</p>}
        {!organizations && !orgListError && <p className="text-xs text-gray-500">読み込み中...</p>}
        {organizations && organizations.length === 0 && (
          <p className="text-xs text-gray-500">まだ組織がありません。</p>
        )}
        {organizations && organizations.length > 0 && (
          <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden">
            {organizations.map((org) => (
              <li key={org.id} className="px-4 py-3 bg-bg2 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-bold">{org.name}</div>
                  <button
                    onClick={() => handleDeleteOrg(org)}
                    disabled={deletingOrgId === org.id}
                    className="text-xs text-rose border border-rose/50 rounded-md px-2 py-1 disabled:opacity-50"
                  >
                    {deletingOrgId === org.id ? "削除中..." : "削除"}
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  所属店舗:{" "}
                  {org.stores.length > 0 ? org.stores.map((s) => s.name).join("、") : "なし（上の店舗一覧から割り当ててください）"}
                </div>
                {org.loginEmail ? (
                  <div className="text-xs text-gray-400">本部ログイン: {org.loginEmail}</div>
                ) : loginFormOrgId === org.id ? (
                  <form onSubmit={handleCreateLogin} className="space-y-2 pt-1">
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="本部担当者のメールアドレス"
                      className="w-full rounded-md bg-bg border border-line px-2 py-1.5 text-xs"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        minLength={6}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="flex-1 min-w-0 rounded-md bg-bg border border-line px-2 py-1.5 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setLoginPassword(generatePassword())}
                        className="text-xs text-gray-400 border border-line rounded-md px-2 shrink-0"
                      >
                        再生成
                      </button>
                    </div>
                    {loginFormError && <p className="text-rose text-xs">{loginFormError}</p>}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setLoginFormOrgId(null)}
                        className="flex-1 rounded-md border border-line py-1.5 text-xs text-gray-300"
                      >
                        キャンセル
                      </button>
                      <button
                        type="submit"
                        disabled={creatingLogin}
                        className="flex-1 rounded-md bg-gold text-bg py-1.5 text-xs font-bold disabled:opacity-50"
                      >
                        {creatingLogin ? "作成中..." : "発行する"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => openLoginForm(org.id)}
                    className="text-xs rounded-md border border-dashed border-gold text-gold px-2 py-1"
                  >
                    ＋ 本部ログインを発行
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
