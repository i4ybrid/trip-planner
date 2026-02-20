export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">TripPlanner</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Plan trips with your friends
      </p>
      <div className="flex gap-4">
        <a
          href="/login"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
        >
          Sign In
        </a>
        <a
          href="/dashboard"
          className="px-6 py-3 border border-border rounded-lg hover:bg-secondary transition"
        >
          Go to Dashboard
        </a>
      </div>
    </main>
  );
}
