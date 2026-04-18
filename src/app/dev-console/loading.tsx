export default function DevConsoleLoading() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-[#08111b]"
      role="status"
      aria-label="Loading dev console">
      <div
        className="h-10 w-10 rounded-full"
        style={{
          border: '2px solid transparent',
          borderTopColor: '#7ef2cf',
          animation: 'spin 0.8s linear infinite',
        }}
      />
    </div>
  );
}
