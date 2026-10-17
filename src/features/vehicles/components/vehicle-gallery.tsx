import Image from "next/image";

type VehicleGalleryProps = Readonly<{
  name: string;
  images: readonly string[];
}>;

/* Tonal plate so cut-out product shots never float on flat white, with the
   hairline drawn as an inset ring so it never doubles up with the shadow. */
const plateClass =
  "relative overflow-hidden rounded-[var(--r-panel)] bg-[linear-gradient(155deg,var(--ink-50)_0%,var(--surface-sunken)_58%,var(--ink-100)_100%)] shadow-[inset_0_0_0_1px_var(--line-subtle),var(--elev-2)]";

export function VehicleGallery({ name, images }: VehicleGalleryProps) {
  if (images.length === 0) {
    return null;
  }

  const [hero, second, third] = images;

  if (images.length === 1) {
    return (
      <section
        aria-label={`${name} gallery`}
        className="flex w-full justify-end"
      >
        <div className={`${plateClass} w-full max-w-[30rem] min-h-[14rem] sm:min-h-[18rem]`}>
          <Image
            src={hero}
            alt={`${name} — product photo`}
            fill
            sizes="(max-width: 768px) 100vw, 30rem"
            className="object-contain object-right-top scale-[1.04] -translate-y-2 sm:scale-[1.08] sm:-translate-y-3"
            priority
          />
        </div>
      </section>
    );
  }

  if (images.length === 2) {
    return (
      <section aria-label={`${name} gallery`} className="grid gap-3 sm:grid-cols-2">
        <div className={`${plateClass} min-h-[14rem] sm:min-h-[20rem]`}>
          <Image
            src={hero}
            alt={`${name} — main image`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain"
            priority
          />
        </div>
        <div className={`${plateClass} min-h-[14rem] sm:min-h-[20rem]`}>
          <Image
            src={second}
            alt={`${name} — second image`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain"
            loading="lazy"
          />
        </div>
      </section>
    );
  }

  return (
    <section aria-label={`${name} gallery`} className="grid gap-3 sm:grid-cols-2">
      <div className={`${plateClass} min-h-[14rem] sm:row-span-2 sm:min-h-[20rem]`}>
        <Image
          src={hero}
          alt={`${name} — main image`}
          fill
          sizes="(max-width: 768px) 100vw, 66vw"
          className="object-contain"
          priority
        />
      </div>
      <div className={`${plateClass} min-h-[9.5rem]`}>
        <Image
          src={second!}
          alt={`${name} — second image`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-contain"
          loading="lazy"
        />
      </div>
      <div className={`${plateClass} min-h-[9.5rem]`}>
        <Image
          src={third!}
          alt={`${name} — third image`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-contain"
          loading="lazy"
        />
      </div>
    </section>
  );
}
