import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-display mb-8">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (user?.role === "admin") {
      navigate("/admin/dashboard");
    } else if (user?.role === "sales") {
      navigate("/sales/dashboard");
    } else if (user?.role === "power_company") {
      navigate("/marketplace");
    } else {
      navigate("/");
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Hero Section */}
      <section className="py-24 px-8 border-b-4 border-black">
        <div className="container max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Big Typography */}
            <div className="bracket-top">
              <h1 className="text-display mb-6">
                電力営業<br />
                <span className="underline-thick">マッチング</span>
              </h1>
              <p className="text-lg leading-relaxed mb-8 max-w-md">
                営業部隊が獲得したアポイント情報を電力会社に提供。複数社の競争入札で最適な価格を実現します。
              </p>
              <div className="flex gap-4">
                <a href={getLoginUrl()} className="btn-brutalist">
                  ログイン
                </a>
                <button className="btn-brutalist-outline">
                  詳細を見る
                </button>
              </div>
            </div>

            {/* Right: Geometric Shape */}
            <div className="bg-black h-96 border-4 border-black flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-5xl font-bold mb-4">■</div>
                <p className="text-sm tracking-widest">APPOINTMENT MARKETPLACE</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-8">
        <div className="container max-w-6xl">
          <h2 className="text-headline mb-16">
            <span className="underline-thick">主な機能</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card-brutalist">
              <div className="text-4xl font-bold mb-4">01</div>
              <h3 className="text-subheading mb-4">案件登録</h3>
              <p className="text-base leading-relaxed">
                営業部隊がアポイント情報を業種・規模・エリアで登録・公開
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card-brutalist">
              <div className="text-4xl font-bold mb-4">02</div>
              <h3 className="text-subheading mb-4">競争入札</h3>
              <p className="text-base leading-relaxed">
                電力会社が興味のある案件に入札。複数社が購入可能
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card-brutalist">
              <div className="text-4xl font-bold mb-4">03</div>
              <h3 className="text-subheading mb-4">月末精算</h3>
              <p className="text-base leading-relaxed">
                入札履歴から自動生成された請求書でシンプル精算
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-24 px-8 bg-black text-white border-t-4 border-white">
        <div className="container max-w-6xl">
          <h2 className="text-headline mb-16">
            <span className="underline-thick">利用者別ガイド</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Sales Team */}
            <div className="border-4 border-white p-8">
              <h3 className="text-3xl font-bold mb-4">営業部隊</h3>
              <ul className="space-y-3 text-base">
                <li>✓ アポイント情報を登録・管理</li>
                <li>✓ 入札状況をリアルタイム監視</li>
                <li>✓ 月末請求書を自動生成</li>
              </ul>
            </div>

            {/* Power Company */}
            <div className="border-4 border-white p-8">
              <h3 className="text-3xl font-bold mb-4">電力会社</h3>
              <ul className="space-y-3 text-base">
                <li>✓ 業種・規模・エリアで検索</li>
                <li>✓ 興味のある案件に入札</li>
                <li>✓ 購入社数は非公開（機密保護）</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-8 border-t-4 border-black">
        <div className="container max-w-4xl text-center">
          <h2 className="text-headline mb-8">
            今すぐ<span className="underline-thick">始める</span>
          </h2>
          <p className="text-lg mb-12 max-w-2xl mx-auto">
            営業部隊のアポイント情報と電力会社のニーズを効率的にマッチング。
            シンプルで透明性のある取引プラットフォーム。
          </p>
          <a href={getLoginUrl()} className="btn-brutalist inline-block">
            ログイン・登録
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 border-t-4 border-black bg-white">
        <div className="container max-w-6xl">
          <div className="flex justify-between items-center">
            <div className="text-sm font-bold tracking-widest">
              APPOINTMENT MARKETPLACE
            </div>
            <div className="text-xs text-gray-600">
              © 2024 All Rights Reserved
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
