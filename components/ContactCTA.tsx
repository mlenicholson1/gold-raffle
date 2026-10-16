export default function ContactCTA({ className = "" }: { className?: string }) {
  return (
    <p className={`text-sm text-gray-500 ${className}`}>
      Interested in learning more?{" "}
      <a
        href="mailto:goldasaservice@gold.org"
        className="font-medium text-[#704287] underline hover:text-[#3c1e4b]"
      >
        goldasaservice@gold.org
      </a>
    </p>
  );
}
