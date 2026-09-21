const DUMMY_AVATAR = "/images/logo/logo.png";

export function Avatar({ src, alt, size = 40 }: { src?: string; alt: string; size?: number }) {
  return (
    <img
      src={src || DUMMY_AVATAR}
      alt={alt}
      width={size}
      height={size}
      className="shrink-0 rounded-full border border-gray-200 object-cover dark:border-gray-700"
      style={{ width: size, height: size }}
    />
  );
}
