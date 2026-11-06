import Link from "next/link"

export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-3xl space-y-10">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to store</Link>
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Customer care</p>
          <h1 className="text-4xl font-semibold tracking-tight">Returns & refunds</h1>
          <p className="text-lg text-muted-foreground">We want every CHISTORE NG order to feel right. Contact support within 7 days of delivery if your item is damaged, incorrect, or materially different from its listing.</p>
        </header>
        <section className="grid gap-4 sm:grid-cols-3">
          {[['01', 'Contact us', 'Share your order number and clear photos of the issue.'], ['02', 'Review', 'Our team confirms eligibility and the next step.'], ['03', 'Resolution', 'We arrange a replacement, return, or refund.']].map(([number, title, body]) => (
            <article key={number} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm font-semibold text-primary">{number}</p>
              <h2 className="mt-8 font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
            </article>
          ))}
        </section>
        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">Eligibility</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
            <li>Items must be unused and returned in their original condition where applicable.</li>
            <li>Personalized, digital, or hygiene-sensitive products may be non-returnable.</li>
            <li>Refund timing depends on the payment method and bank processing times.</li>
          </ul>
        </section>
      </div>
    </main>
  )
}
