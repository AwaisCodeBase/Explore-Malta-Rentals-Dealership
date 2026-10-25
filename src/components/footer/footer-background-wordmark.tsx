type FooterBackgroundWordmarkProps = {
  firstWord?: string;
  secondWord?: string;
};

export function FooterBackgroundWordmark({
  firstWord = "Malta",
  secondWord = "Rentals",
}: FooterBackgroundWordmarkProps) {
  return (
    <div className="footer-bg-wordmark-wrap" aria-hidden>
      <span className="footer-bg-wordmark">
        <span className="footer-bg-wordmark-malta">{firstWord}</span>
        <span className="footer-bg-wordmark-rentals">{secondWord}</span>
      </span>
    </div>
  );
}
