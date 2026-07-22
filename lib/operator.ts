// このアプリ全体の運営者（プラットフォーム管理者）かどうかを判定する
export function isOperatorEmail(email: string | null | undefined) {
  const operatorEmail = process.env.OPERATOR_EMAIL;
  return !!email && !!operatorEmail && email.toLowerCase() === operatorEmail.toLowerCase();
}
