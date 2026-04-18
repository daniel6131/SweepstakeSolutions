export default function DraftLoading() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-[#030d10]"
      role="status"
      aria-label="Loading draft">
      <div
        className="h-10 w-10 rounded-full"
        style={{
          border: '2px solid transparent',
          borderTopColor: '#94ffe4',
          animation: 'spin 0.8s linear infinite',
        }}
      />
    </div>
  );
}
